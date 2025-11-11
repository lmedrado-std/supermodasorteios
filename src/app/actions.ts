'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, runTransaction, doc, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  nome: z.string().min(2, { message: 'O nome completo é obrigatório.' }),
  cpf: z.string().length(11, { message: 'O CPF deve ter 11 dígitos.' }).regex(/^\d+$/, { message: 'CPF deve conter apenas números.' }),
  numeroCompra: z.string().min(1, { message: 'O número da compra é obrigatório.' }),
});

export type State = {
  errors?: {
    nome?: string[];
    cpf?: string[];
    numeroCompra?: string[];
  };
  message?: string | null;
  coupon?: string | null;
};

async function getNextCouponNumber(): Promise<string> {
  const counterRef = doc(db, 'counters', 'cupons');

  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextNumber = 1;
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().lastNumber || 0) + 1;
      }
      transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
      return nextNumber;
    });

    return `SM-${String(newNumber).padStart(5, '0')}`;
  } catch (error) {
    console.error("Error getting next coupon number:", error);
    throw new Error("Não foi possível gerar o número do cupom. Tente novamente.");
  }
}

export async function generateCoupon(prevState: State, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    nome: formData.get('nome'),
    cpf: formData.get('cpf'),
    numeroCompra: formData.get('numeroCompra'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Campos inválidos. Por favor, corrija os erros e tente novamente.',
    };
  }

  const { nome, cpf, numeroCompra } = validatedFields.data;

  try {
    const q = query(collection(db, 'cupons'), where('cpf', '==', cpf), where('numeroCompra', '==', numeroCompra));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return {
        message: 'Já existe um cupom cadastrado para este CPF e número de compra.',
      };
    }
    
    const numeroCupom = await getNextCouponNumber();
    
    await addDoc(collection(db, 'cupons'), {
      nome,
      cpf,
      numeroCompra,
      numeroCupom,
      dataCadastro: serverTimestamp(),
    });

    revalidatePath('/admin');
    
    return {
        message: 'Cadastro realizado com sucesso!',
        coupon: numeroCupom,
    }

  } catch (error) {
    console.error(error);
    return {
      message: 'Erro no servidor. Não foi possível gerar o cupom. Tente novamente mais tarde.',
    };
  }
}

const LoginSchema = z.object({
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro de validação.',
    };
  }
  
  const { password } = validatedFields.data;
  const adminPassword = process.env.ADMIN_PASSWORD || 'supermoda2025';

  if (password === adminPassword) {
    cookies().set('supermoda_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    redirect('/admin');
  } else {
    return {
      message: 'Senha incorreta.',
    };
  }
}

export async function logout() {
  cookies().delete('supermoda_auth');
  redirect('/admin/login');
}

export async function getAllCoupons() {
  const couponsRef = collection(db, 'cupons');
  const q = query(couponsRef, orderBy('dataCadastro', 'desc'));
  
  try {
    const querySnapshot = await getDocs(q);
    
    const coupons = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            nome: data.nome,
            cpf: data.cpf,
            numeroCompra: data.numeroCompra,
            numeroCupom: data.numeroCupom,
            dataCadastro: data.dataCadastro?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) || 'N/A'
        };
    });

    return coupons;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

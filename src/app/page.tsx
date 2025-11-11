'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RegistrationForm } from '@/components/RegistrationForm';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { FirebaseClientProvider } from '@/firebase';
import { CountdownTimer } from '@/components/CountdownTimer';

export default function Home() {
  return (
    <FirebaseClientProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
                  Participe do Sorteio!
                </CardTitle>
                <div className="pt-4">
                  <CountdownTimer />
                </div>
                <CardDescription className="text-center pt-4">
                  Preencha seus dados para gerar seu número da sorte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationForm />
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </FirebaseClientProvider>
  );
}

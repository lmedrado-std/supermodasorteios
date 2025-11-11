'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Ticket, Calendar, Users, ShoppingCart, Award, Search, AlertTriangle, Heart, Info, Instagram } from 'lucide-react';

export default function RegulamentoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="text-center">
              <Ticket className="h-10 w-10 mx-auto text-primary" />
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary mt-2">
                Regulamento da Campanha
              </CardTitle>
              <CardDescription>“Sorteio Supermoda”</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm md:prose-base max-w-none space-y-6 text-foreground">
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Info className="h-5 w-5" />
                        1. Da Promoção
                    </h2>
                    <p className="mt-2">
                    A campanha “Sorteio Supermoda – que te deixa na moda e ainda te dá a chance de ganhar prêmios!” é uma ação promocional realizada pela Supermoda, com o objetivo de premiar seus clientes e fortalecer o comércio local.
                    </p>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Calendar className="h-5 w-5" />
                        2. Período da Campanha
                    </h2>
                    <p className="mt-2">
                    VERIFIQUE A VIGENCIA DA CMAPANHA ATUAL EM NOSSA LOJA FISICA OU INTAGRAM. Os cupons podem ser gerados até as 23h59 da data limite estipulada no sorteio em vigência. O sorteio será realizado com data definida na loja física e/ou redes sociais oficiais, conforme data divulgada nas redes oficiais da Supermoda.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Users className="h-5 w-5" />
                        3. Quem Pode Participar
                    </h2>
                    <p className="mt-2">
                    Participam da promoção clientes pessoas físicas que realizarem compras na Supermoda Confecções durante o período da campanha. É necessário informar nome completo, CPF, número da compra, valor e data da compra no site oficial da promoção.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <ShoppingCart className="h-5 w-5" />
                        4. Como Participar
                    </h2>
                    <p className="mt-2">
                    A cada valor em compras definido na campanha atual realizadas na loja, o cliente receberá 1 (um) cupom eletrônico da sorte. Os cupons são gerados automaticamente após o cadastro correto da compra no site da promoção. O sistema informará quantos cupons foram gerados e exibirá os números correspondentes (ex: SM-00067 a SM-00568). Cada cupom representa 1 chance de ganhar no sorteio.
                    </p>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Award className="h-5 w-5" />
                        5. Premiação
                    </h2>
                    <p className="mt-2">
                    O prêmio será divulgado previamente nas mídias oficiais da Supermoda (site, Instagram e loja física). O vencedor será identificado pelo número do cupom sorteado e contatado via telefone ou WhatsApp cadastrado. O prêmio é pessoal e intransferível, não podendo ser convertido em dinheiro.
                    </p>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Search className="h-5 w-5" />
                        6. Sorteio e Divulgação
                    </h2>
                    <p className="mt-2">
                    O sorteio será realizado de forma eletrônica e transparente, com acompanhamento da equipe Supermoda. O resultado será divulgado nas redes sociais oficiais e no site da promoção até 48h após o sorteio. O ganhador deverá retirar o prêmio na loja, apresentando documento com foto e comprovante da compra.
                    </p>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <AlertTriangle className="h-5 w-5" />
                        7. Regras Gerais
                    </h2>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Somente serão aceitos números de compras emitidas durante o período da campanha.</li>
                        <li>É vedada a participação de colaboradores e familiares diretos da Supermoda.</li>
                        <li>Em caso de informações incorretas, duplicadas ou inconsistentes, o cupom poderá ser invalidado.</li>
                        <li>A Supermoda reserva-se o direito de alterar ou cancelar a campanha, em caso de força maior ou necessidade administrativa, garantindo transparência a todos os participantes.</li>
                    </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h2 className="flex items-center gap-2 font-bold text-lg text-secondary">
                        <Heart className="h-5 w-5" />
                        8. Dúvidas e Informações
                    </h2>
                    <p className="mt-2">
                        Em caso de dúvidas, entre em contato pelo WhatsApp da loja ou pelas redes sociais oficiais da Supermoda.
                    </p>
                    <p className="flex items-center gap-2 mt-2">
                       <Instagram className="h-4 w-4" /> Instagram: [seu-instagram-aqui]
                    </p>
                </div>

                <div className="text-center pt-6">
                    <p className="font-bold text-lg text-primary">✨ Supermoda!</p>
                    <p className="text-muted-foreground">A loja que te deixa na moda e ainda te dá a chance de ganhar prêmios!</p>
                </div>

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

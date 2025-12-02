import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onStart: () => void;
    onSkip: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onStart,
    onSkip
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            <div className="relative z-10 w-full max-w-2xl mx-4">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Skip Button */}
                    <button
                        onClick={onSkip}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="p-12 text-center text-white">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Sparkles size={40} className="text-white" />
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-bold mb-4">
                            Bem-vindo ao seu CRM! 👋
                        </h1>

                        {/* Description */}
                        <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
                            Vamos criar seu <strong>primeiro board personalizado</strong> em menos de 30 segundos?
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-2xl mb-2">🎯</div>
                                <h3 className="font-semibold mb-1">Templates Prontos</h3>
                                <p className="text-sm text-white/80">Vendas, Onboarding, CS e mais</p>
                            </div>

                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-2xl mb-2">✨</div>
                                <h3 className="font-semibold mb-1">Criação com IA</h3>
                                <p className="text-sm text-white/80">Descreva seu negócio em 1 frase</p>
                            </div>

                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <div className="text-2xl mb-2">⚡</div>
                                <h3 className="font-semibold mb-1">Super Rápido</h3>
                                <p className="text-sm text-white/80">Menos de 30 segundos</p>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={onStart}
                                className="px-8 py-4 bg-white text-primary-600 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                            >
                                Começar agora
                                <ArrowRight size={20} />
                            </button>

                            <button
                                onClick={onSkip}
                                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
                            >
                                Explorar por conta
                            </button>
                        </div>

                        {/* Small print */}
                        <p className="mt-6 text-sm text-white/60">
                            Você pode criar quantos boards quiser depois 😊
                        </p>
                    </div>
                </div>

                {/* Bottom gradient decoration */}
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl -z-10" />
            </div>
        </div>
    );
};

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { StatCard } from './StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('deve renderizar o título corretamente', () => {
    render(
      <StatCard
        title="Total de Vendas"
        value="R$ 50.000"
        subtext="+12% este mês"
        icon={TrendingUp}
        color="blue"
      />
    );

    expect(screen.getByText('Total de Vendas')).toBeInTheDocument();
  });

  it('deve renderizar o valor corretamente', () => {
    render(
      <StatCard
        title="Total de Vendas"
        value="R$ 50.000"
        subtext="+12% este mês"
        icon={TrendingUp}
        color="blue"
      />
    );

    expect(screen.getByText('R$ 50.000')).toBeInTheDocument();
  });

  it('deve renderizar o subtexto corretamente', () => {
    render(
      <StatCard
        title="Total de Vendas"
        value="R$ 50.000"
        subtext="+12% este mês"
        icon={TrendingUp}
        color="green"
      />
    );

    expect(screen.getByText('+12% este mês')).toBeInTheDocument();
  });

  it('deve renderizar com diferentes cores', () => {
    const { container } = render(
      <StatCard
        title="Negócios Fechados"
        value="15"
        subtext="Meta: 20"
        icon={TrendingUp}
        color="purple"
      />
    );

    // Verifica que o componente renderiza sem erros
    expect(container.firstChild).toBeTruthy();
  });
});

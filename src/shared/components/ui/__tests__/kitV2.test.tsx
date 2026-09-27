import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Receipt } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { AlertRow } from "../alert-row/AlertRow"
import { AttentionCard } from "../alert-row/AttentionCard"
import { Avatar } from "../avatar/Avatar"
import { avatarHue, initials } from "../avatar/avatarHue"
import { AvatarStack } from "../avatar/AvatarStack"
import { Card } from "../card/Card"
import { Donut } from "../donut/Donut"
import { EmptyState } from "../empty-state/EmptyState"
import { Field } from "../field/Field"
import { IconButton } from "../icon-button/IconButton"
import { Input } from "../input/Input"
import { Kbd } from "../kbd/Kbd"
import { KpiCard } from "../kpi-card/KpiCard"
import { KpiStrip } from "../kpi-card/KpiStrip"
import { ProgressRing } from "../progress-ring/ProgressRing"
import { Segmented } from "../segmented/Segmented"
import { Tabs } from "../tabs/Tabs"
import { Ticker } from "../ticker/Ticker"

/**
 * Componentes que entraram com o DS v2. Cada bloco guarda a regra do design
 * system que o componente materializa.
 */

describe("<Field />", () => {
  // O rótulo aponta para o controle pelo id — nunca placeholder como rótulo.
  it("liga rótulo e controle pelo id", () => {
    renderWithProviders(<Field label="Responsável">{(id) => <Input id={id} />}</Field>)

    expect(screen.getByLabelText("Responsável")).toBeInTheDocument()
  })

  it("mostra a dica sem erro e troca pelo erro quando há", () => {
    const { rerender } = renderWithProviders(
      <Field label="Prazo" hint="Data de término">
        {(id) => <Input id={id} />}
      </Field>,
    )
    expect(screen.getByText("Data de término")).toBeInTheDocument()

    rerender(
      <Field label="Prazo" hint="Data de término" error="O término precisa ser depois do início.">
        {(id) => <Input id={id} />}
      </Field>,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("O término precisa ser depois do início.")
    expect(screen.queryByText("Data de término")).not.toBeInTheDocument()
  })
})

describe("<Card />", () => {
  it("é superfície com contorno e padding por padrão", () => {
    renderWithProviders(<Card data-testid="card">Conteúdo</Card>)

    expect(screen.getByTestId("card")).toHaveClass("bg-surface", "hairline", "p-5")
  })

  it("sobe no hover quando é interativo e aceita sem padding", () => {
    renderWithProviders(
      <Card data-testid="card" interactive padded={false}>
        Obra
      </Card>,
    )

    expect(screen.getByTestId("card")).toHaveClass("hover:shadow-soft")
    expect(screen.getByTestId("card")).not.toHaveClass("p-5")
  })
})

describe("<IconButton />", () => {
  // Botão só de ícone precisa de nome acessível.
  it("usa o rótulo como nome acessível e dica", async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <IconButton label="Notificações" onClick={onClick}>
        <Receipt />
      </IconButton>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Notificações" }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole("button")).toHaveAttribute("title", "Notificações")
    expect(screen.getByRole("button")).toHaveAttribute("type", "button")
  })
})

describe("<Kbd />", () => {
  it("desenha a tecla", () => {
    renderWithProviders(<Kbd>⌘K</Kbd>)

    expect(screen.getByText("⌘K").tagName).toBe("KBD")
  })
})

describe("<EmptyState />", () => {
  it("fica sobre papel quadriculado com título, corpo e uma ação", () => {
    const { container } = renderWithProviders(
      <EmptyState
        title="Nenhum lançamento ainda"
        body="Lance a primeira despesa da obra."
        icon={<Receipt data-testid="icone" />}
        action={<button type="button">Lançar despesa</button>}
      />,
    )

    expect(container.firstElementChild).toHaveClass("blueprint")
    expect(screen.getByText("Nenhum lançamento ainda")).toBeInTheDocument()
    expect(screen.getByText("Lance a primeira despesa da obra.")).toBeInTheDocument()
    expect(screen.getByTestId("icone")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lançar despesa" })).toBeInTheDocument()
  })

  it("funciona só com o título", () => {
    renderWithProviders(<EmptyState title="Sem documentos" />)

    expect(screen.getByText("Sem documentos")).toBeInTheDocument()
  })
})

describe("<Segmented />", () => {
  const OPCOES = [
    { value: "all", label: "Todas", count: 5 },
    { value: "late", label: "Atenção", count: 2, alert: true },
  ] as const

  it("marca a opção ativa e troca ao clicar", async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <Segmented id="t" label="Filtro" value="all" onChange={onChange} options={[...OPCOES]} />,
    )

    expect(screen.getByRole("tab", { name: /Todas/ })).toHaveAttribute("aria-selected", "true")
    await userEvent.click(screen.getByRole("tab", { name: /Atenção/ }))

    expect(onChange).toHaveBeenCalledWith("late")
  })

  it("mostra a contagem de cada opção", () => {
    renderWithProviders(
      <Segmented id="t" value="all" onChange={vi.fn()} options={[...OPCOES]} size="sm" />,
    )

    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })
})

describe("<Tabs />", () => {
  // Uma rota por aba; a ativa sai da URL.
  it("marca a aba da rota atual e mostra contagem", () => {
    renderWithProviders(
      <Tabs
        id="obra"
        label="Seções da obra"
        items={[
          { to: "/obras/1/visao-geral", label: "Visão geral" },
          { to: "/obras/1/tarefas", label: "Tarefas", count: 12, alert: true },
        ]}
      />,
      { route: "/obras/1/tarefas" },
    )

    expect(screen.getByRole("link", { name: /Tarefas/ })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: /Visão geral/ })).not.toHaveAttribute("aria-current")
    expect(screen.getByText("12")).toBeInTheDocument()
  })
})

describe("<Avatar />", () => {
  it("mostra as iniciais com nome acessível", () => {
    renderWithProviders(<Avatar name="Marina Kowalski" />)

    expect(screen.getByRole("img", { name: "Marina Kowalski" })).toHaveTextContent("MK")
  })

  // Sem responsável: círculo tracejado com "?".
  it("mostra o vazio tracejado sem pessoa", () => {
    renderWithProviders(<Avatar name={null} />)

    expect(screen.getByText("?")).toHaveClass("border-dashed")
  })

  it("dá o mesmo matiz para o mesmo nome", () => {
    expect(avatarHue("Marina")).toBe(avatarHue("Marina"))
    expect(avatarHue("Marina")).toBeGreaterThanOrEqual(0)
    expect(avatarHue("Marina")).toBeLessThan(360)
  })

  it.each([
    ["Marina Kowalski", "MK"],
    ["Rafael", "R"],
    ["  ana  de souza ", "AS"],
    ["", "?"],
  ])("tira as iniciais de %j", (nome, esperado) => {
    expect(initials(nome)).toBe(esperado)
  })
})

describe("<AvatarStack />", () => {
  it("empilha até o máximo e resume o resto em +N", () => {
    const pessoas = ["Ana", "Bia", "Caio", "Davi", "Eva", "Fábio"].map((name, id) => ({ id, name }))

    renderWithProviders(<AvatarStack people={pessoas} max={4} />)

    expect(screen.getAllByRole("img")).toHaveLength(4)
    expect(screen.getByText("+2")).toBeInTheDocument()
  })
})

describe("<Ticker />", () => {
  // O leitor de tela ouve o valor final, não a contagem.
  it("anuncia o valor final formatado", () => {
    renderWithProviders(<Ticker value={42} format={(n) => `${Math.round(n)}%`} />)

    expect(screen.getByLabelText("42%")).toBeInTheDocument()
  })
})

describe("<KpiCard /> e <KpiStrip />", () => {
  it("monta a faixa com células sem superfície própria", () => {
    renderWithProviders(
      <KpiStrip>
        <KpiCard bare label="Obras ativas" value="3" />
        <KpiCard bare danger label="Atrasos" value="2">
          precisam de decisão
        </KpiCard>
      </KpiStrip>,
    )

    expect(screen.getByText("Obras ativas").parentElement).not.toHaveClass("bg-surface")
    expect(screen.getByText("2")).toHaveClass("text-danger")
    expect(screen.getByText("precisam de decisão")).toBeInTheDocument()
  })
})

describe("<Donut /> e <ProgressRing />", () => {
  it("desenha uma fatia por segmento sobre o trilho", () => {
    const { container } = renderWithProviders(
      <Donut
        label="Orçamento por categoria"
        segments={[
          { key: "a", value: 60, color: "var(--gold)" },
          { key: "b", value: 40, color: "var(--success)" },
        ]}
      >
        <span>72%</span>
      </Donut>,
    )

    expect(screen.getByRole("img", { name: "Orçamento por categoria" })).toBeInTheDocument()
    expect(container.querySelectorAll("circle")).toHaveLength(3)
    expect(screen.getByText("72%")).toBeInTheDocument()
  })

  it("não quebra com todos os segmentos zerados", () => {
    const { container } = renderWithProviders(
      <Donut segments={[{ key: "a", value: 0, color: "var(--gold)" }]} />,
    )

    expect(container.querySelectorAll("circle")).toHaveLength(2)
  })

  it.each(["gold", "danger", "ok"] as const)("desenha o anel no tom %s", (tone) => {
    renderWithProviders(<ProgressRing value={140} tone={tone} label="Residência Mercês" />)

    expect(screen.getByRole("img", { name: "Residência Mercês" })).toBeInTheDocument()
  })
})

describe("<AlertRow /> e <AttentionCard />", () => {
  it("leva à aba onde o problema se resolve", () => {
    renderWithProviders(
      <AttentionCard heading="2 pontos precisam de decisão" count={1} emptyText="Tudo em dia.">
        <AlertRow
          tone="danger"
          icon={<Receipt />}
          title="Marcenaria estourou"
          meta="R$ 4.040 além de R$ 52.000"
          to="/obras/1/orcamento"
        />
      </AttentionCard>,
    )

    expect(screen.getByText("2 pontos precisam de decisão")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Marcenaria estourou/ })).toHaveAttribute("href", "/obras/1/orcamento")
  })

  // Sem alertas: uma linha de check em vez de uma lista vazia silenciosa.
  it("mostra a linha de tudo em dia sem alertas", () => {
    renderWithProviders(
      <AttentionCard heading="—" count={0} emptyText="Tudo dentro do prazo e do orçamento.">
        {null}
      </AttentionCard>,
    )

    expect(screen.getByText("Tudo dentro do prazo e do orçamento.")).toBeInTheDocument()
  })

  it("aceita o tom de alerta", () => {
    renderWithProviders(
      <AlertRow tone="warning" icon={<Receipt />} title="Elétrica em 91%" meta="R$ 900 de folga" to="/x" />,
    )

    expect(screen.getByText("Elétrica em 91%")).toBeInTheDocument()
  })
})

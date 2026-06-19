# OFM Systems — Design System Master

> Gerado pela skill ui-ux-pro-max | Padrão: Enterprise Gateway / SaaS B2B Interno

---

## 1. Identidade

| Campo | Valor |
|-------|-------|
| Produto | Gestão de Projetos Interno |
| Empresa | OFM Systems |
| Público | Equipe interna: PMs, analistas, diretores |
| Tom | Profissional, confiável, eficiente |
| Estilo UI | Enterprise Clean + Dark Mode Support |

---

## 2. Paleta de Cores (CSS Variables)

```css
/* Brand */
--brand-50:  #eef7ff
--brand-100: #d8ecff
--brand-200: #b3d9ff
--brand-500: #1c7ed6   /* primary action */
--brand-600: #156bb8   /* hover */
--brand-700: #0d5595   /* active/pressed */

/* Semantic */
--success:   #0f8f5f
--warning:   #b7791f
--danger:    #d64545

/* Surface (Light) */
--canvas:    #f5f7fb   /* page background */
--surface:   #ffffff   /* cards, sidebar */
--ink:       #172033   /* primary text */
--line:      #d9e1ec   /* borders, dividers */
--muted:     #64748b   /* secondary text */

/* Surface (Dark) */
--dk-canvas:  #0f172a
--dk-surface: #111c31
--dk-border:  #263752
--dk-text:    #e5edf7
--dk-muted:   #99a8bd
```

---

## 3. Tipografia

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Plus Jakarta Sans | 800 | 32–40px |
| H1 | Plus Jakarta Sans | 700 | 24px |
| H2 | Plus Jakarta Sans | 600 | 18–20px |
| H3 | Plus Jakarta Sans | 600 | 16px |
| Body | Plus Jakarta Sans | 400 | 14–16px |
| Label / Badge | Plus Jakarta Sans | 600 | 11–12px |
| Mono / Números | tabular-nums (CSS) | 500 | — |

**Google Font import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
```

---

## 4. Espaçamento

Escala base: **4px / 8dp**

| Token | Valor | Uso |
|-------|-------|-----|
| space-1 | 4px | gap entre ícone e texto |
| space-2 | 8px | padding interno badges |
| space-3 | 12px | gap entre itens de lista |
| space-4 | 16px | padding de card (compact) |
| space-5 | 20px | padding de card |
| space-6 | 24px | padding de seção |
| space-8 | 32px | gap entre seções |
| space-10 | 40px | gap entre blocos maiores |

---

## 5. Componentes — Guia de Uso

### Botão Primário
```tsx
<button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
  Salvar
</button>
```

### Botão Secundário
```tsx
<button className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-slate-50">
  Cancelar
</button>
```

### Card de Conteúdo
```tsx
<div className="rounded-lg border border-line bg-white p-5 shadow-soft dark:bg-[#111c31]">
  ...
</div>
```

### Input de Formulário
```tsx
<label htmlFor="field" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
  Label <span aria-hidden="true" className="text-danger">*</span>
</label>
<input
  id="field"
  className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-[#111c31] dark:text-white"
/>
<p className="mt-1 text-xs text-slate-500">Texto de ajuda opcional</p>
```

### Badge / Status
- Usar `<StatusBadge status={...} />` — já mapeado para todos os estados

### Progress Bar
- Usar `<ProgressBar value={percent} showLabel />` — auto-tone por porcentagem

---

## 6. Animações

| Token | Valor | Uso |
|-------|-------|-----|
| duration-fast | 150ms | micro-interações (hover, toggle) |
| duration-base | 200ms | entrada de elementos |
| duration-slow | 300ms | modais, sidebars, transições de página |
| ease-out | cubic-bezier(0.16, 1, 0.3, 1) | entradas |
| ease-in | cubic-bezier(0.4, 0, 1, 1) | saídas |

```tsx
// Sempre respeitar reduced-motion
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 7. Layout

| Breakpoint | Largura | Comportamento |
|------------|---------|---------------|
| sm | 640px | – |
| md | 768px | – |
| lg | 1024px | Sidebar aparece (260px) |
| xl | 1280px | Conteúdo mais largo |
| 2xl | 1536px | Max-width aplicado |

**Grid principal:** `lg:grid-cols-[260px_1fr]`
**Padding de página:** `p-4 lg:p-6`
**Max-width conteúdo:** `max-w-7xl` (quando necessário)

---

## 8. Acessibilidade — Checklist

- [ ] Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- [ ] Foco visível em todos os elementos interativos
- [ ] Labels em todos os inputs (não só placeholder)
- [ ] role="alert" em mensagens de erro
- [ ] aria-label em botões apenas com ícone
- [ ] aria-current="page" no nav item ativo
- [ ] prefers-reduced-motion respeitado
- [ ] Não usar cor como único indicador de estado

---

## 9. Telas — Status de Implementação

| Tela | Status | Observações |
|------|--------|-------------|
| Dashboard | ✅ Atualizado | ProgressBar, EmptyState, Alerts melhorados |
| App Shell | ✅ Atualizado | Active nav, mobile drawer, avatar, OFM branding |
| Skeleton Loaders | ✅ Criado | Dashboard, Projects, Tasks loading states |
| Empty State | ✅ Criado | Componente reutilizável |
| Breadcrumb | ✅ Criado | Componente reutilizável |
| Progress Bar | ✅ Criado | Auto-tone por porcentagem |
| Page Header | ✅ Atualizado | Suporte a breadcrumb, ícone no botão |
| Metric Card | ✅ Atualizado | Trend indicator, hover state |
| Projects List | 🔲 Pendente | Usar EmptyState, skeleton, status badges |
| Task Management | 🔲 Pendente | Filtros melhorados, bulk actions |
| Gantt | 🔲 Pendente | Toolbar responsiva |
| Kanban | 🔲 Pendente | Drag-and-drop visual |
| Login Page | 🔲 Pendente | Design renovado com brand |
| Admin | 🔲 Pendente | DataTable com sorting |
| Relatórios | 🔲 Pendente | Export buttons, charts |
| Portal Público | 🔲 Pendente | Design independente |

---

## 10. Anti-Patterns — Evitar

- ❌ `text-[#hex]` direto — usar tokens semânticos
- ❌ `w-[400px]` fixo — usar `max-w-*` com `w-full`
- ❌ `z-[999]` ad-hoc — usar escala: 10/20/40/100/1000
- ❌ Botão sem `cursor-pointer` (Tailwind não inclui por padrão)
- ❌ Input só com `placeholder`, sem `<label>`
- ❌ Tabela sem `scope="col"` nos headers
- ❌ Emoji como ícone de interface
- ❌ `onClick` sem feedback visual de loading
- ❌ Sidebar com `h-screen` sem `overflow-y-auto` no nav

---

_Última atualização: 2026-06-19 | Skill: ui-ux-pro-max v2.5_

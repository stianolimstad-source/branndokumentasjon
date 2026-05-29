# Fjern auto-redirect for innlogget branningeniør

## Bakgrunn

I `src/pages/RollePicker.tsx` (rotruten `/`) finnes denne logikken som ble lagt til i prompt 48:

```tsx
if (role === "engineer") {
  navigate("/mine-prosjekter", { replace: true });
  return;
}
if (role === "customer") {
  navigate("/kunde", { replace: true });
  return;
}
```

Engineer-grenen skal fjernes. Customer-grenen beholdes uendret.

## Endring

**Fil:** `src/pages/RollePicker.tsx`

Fjern `if (role === "engineer") { navigate("/mine-prosjekter", ...) }`-blokken. Når en innlogget engineer treffer `/`, skal `RollePicker` vise rollevalg-siden som vanlig (akkurat som før kunde-portalen ble lagt til, der `/` viste landing/Index).

Merk: før prompt 48 var `/` mappet til `Index` (branningeniør-landing). Nå er `/` = `RollePicker` og `/branningenior` = `Index`. Siden brukeren uttrykkelig sier «engineer beholder dagens flyt uendret – ingen auto-redirect», lar vi innlogget engineer havne på RollePicker når de manuelt går til `/`. De kan deretter velge «Jeg er branningeniør» eller bruke header-menyen til `/mine-prosjekter` / `/dashboard` som før.

Hvis ønsket heller er at innlogget engineer skal sendes til `/branningenior` (Index-landing) i stedet for å bli stående på rollevelgeren, kan vi gjøre det – men det er ikke det prompten ber om. Prompten sier «ingen auto-redirect».

## Beholdes uendret

- `localStorage`-basert ruting for ikke-innloggede (engineer → `/branningenior`, customer → `/kunde-landing`).
- Customer-auto-redirect til `/kunde` ved innlogging.
- `RoleSelectModal` (RoleGate i `App.tsx`) som fallback for innloggede uten rolle.
- Alle ruter og header-menyvalg.

## Verifisering

- Innlogget engineer på `/`: ser RollePicker (ingen redirect).
- `/mine-prosjekter` via header: fungerer.
- Utlogget med `branndok_selected_role=engineer` i localStorage: redirectes til `/branningenior`.
- Innlogget customer: redirectes til `/kunde`.

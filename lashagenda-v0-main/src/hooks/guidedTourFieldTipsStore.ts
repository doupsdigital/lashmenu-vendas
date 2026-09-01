// Sinaliza se as dicas de campo (driver.js) do checklist guiado estão
// rodando agora. useGuidedTourFieldTips roda dentro da página (Configurações,
// Serviços); o banner compacto do checklist é renderizado no Layout — sem
// esse estado compartilhado, o banner não tem como saber que as dicas estão
// abertas por cima dele.
let active = false;
const listeners = new Set<() => void>();

export function setFieldTipsActive(value: boolean) {
  if (active === value) return;
  active = value;
  listeners.forEach((listener) => listener());
}

export function getFieldTipsActive() {
  return active;
}

export function subscribeFieldTipsActive(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

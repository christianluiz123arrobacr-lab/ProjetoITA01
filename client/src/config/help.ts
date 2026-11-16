export const HELP_PATH = "/ajuda";

const support = {
  phone: "5566997170627",
  message: "Olá! Preciso de ajuda com a plataforma Projeto Vetor.",
};

export const SUPPORT_WHATSAPP_URL =
  `https://wa.me/${support.phone}?text=${encodeURIComponent(support.message)}`;

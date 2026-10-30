import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "tr" | "en";

const dict = {
  tr: {
    appName: "Yeşil Rehber",
    signOut: "Çıkış",
    scan: "Tara",
    history: "Geçmiş",
    heroTitle: "Bu bitki ne?",
    heroText: "Fotoğrafını çek ya da yükle; türünü, sulama ve bakım ihtiyaçlarını anında öğren.",
    signInToStart: "Başlamak için giriş yap",
    selectedPlant: "Seçilen bitki",
    analyzing: "Bitki inceleniyor…",
    takePhoto: "Fotoğraf Çek",
    uploadFromGallery: "Galeriden Yükle",
    pickImage: "Lütfen bir görsel seçin.",
    noPlantFound: "Bu fotoğrafta bir bitki bulamadık. Daha yakından tekrar deneyin.",
    genericError: "Bir hata oluştu.",
    myPlants: "Bitkilerim",
    noScansYet: "Henüz tarama yok. İlk bitkini tara!",
    delete: "Sil",
    deleteConfirm: "Silinsin mi?",
    deletePlantConfirm: "Bu bitkiyi silmek istediğine emin misin?",
    notFound: "Kayıt bulunamadı.",
    match: "eşleşme",
    careGuide: "Bakım Rehberi",
    completingCare: "Eksik bitki bilgileri tamamlanıyor…",
    retryCare: "Bilgileri tekrar tamamla",
    careCompletionFailed: "Eksik bilgiler tamamlanamadı. Mevcut bilgileriniz korunuyor.",
    watering: "Sulama",
    light: "Işık",
    temperature: "Sıcaklık",
    humidity: "Nem",
    soil: "Toprak",
    fertilizing: "Gübreleme",
    pruning: "Budama",
    propagation: "Çoğaltma",
    toxicity: "Zehirlilik",
    pests: "Hastalık ve Zararlılar",
    funFact: "İlginç Bilgi",
    growthTime: "Büyüme Süresi",
    bulb: "Bitki Soğanı",
    blooming: "Çiçek Açma Dönemi",
    pollen: "Polen ve Tozlaşma",
    scanNewPlant: "Yeni Bitki Tara",
    deletePlant: "Bitkiyi Sil",
    favorite: "Favorilere ekle",
    unfavorite: "Favorilerden çıkar",
    share: "Paylaş",
    linkCopied: "Bağlantı kopyalandı!",
    myNote: "Notum",
    notePlaceholder: "Bu bitki hakkında notlarını yaz…",
    saveNote: "Notu Kaydet",
    noteSaved: "Not kaydedildi",
    login: "Giriş Yap",
    signup: "Kayıt Ol",
    email: "E-posta",
    password: "Şifre",
    noAccount: "Hesabın yok mu?",
    haveAccount: "Zaten hesabın var mı?",
    checkEmail: "E-postanı kontrol et",
    verificationSent: "adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.",
    backToLogin: "Giriş ekranına dön",
    errInvalidLogin: "E-posta veya şifre hatalı.",
    errNotConfirmed: "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.",
    errAlreadyRegistered: "Bu e-posta ile zaten kayıt var. Giriş yapın.",
    errInvalidEmail: "Bu e-posta adresi geçersiz. Lütfen gerçek bir adres girin.",
    errPassword: "Şifre en az 6 karakter olmalı ve yeterince güçlü olmalı.",
  },
  en: {
    appName: "Green Guide",
    signOut: "Sign out",
    scan: "Scan",
    history: "History",
    heroTitle: "What plant is this?",
    heroText: "Take a photo or upload one; instantly learn its species, watering and care needs.",
    signInToStart: "Sign in to get started",
    selectedPlant: "Selected plant",
    analyzing: "Identifying plant…",
    takePhoto: "Take Photo",
    uploadFromGallery: "Upload from Gallery",
    pickImage: "Please select an image.",
    noPlantFound: "We couldn't find a plant in this photo. Try again from closer.",
    genericError: "Something went wrong.",
    myPlants: "My Plants",
    noScansYet: "No scans yet. Scan your first plant!",
    delete: "Delete",
    deleteConfirm: "Delete this?",
    deletePlantConfirm: "Are you sure you want to delete this plant?",
    notFound: "Record not found.",
    match: "match",
    careGuide: "Care Guide",
    completingCare: "Completing missing plant information…",
    retryCare: "Retry completing information",
    careCompletionFailed: "Missing information could not be completed. Your existing information is unchanged.",
    watering: "Watering",
    light: "Light",
    temperature: "Temperature",
    humidity: "Humidity",
    soil: "Soil",
    fertilizing: "Fertilizing",
    pruning: "Pruning",
    propagation: "Propagation",
    toxicity: "Toxicity",
    pests: "Pests & Diseases",
    funFact: "Fun Fact",
    growthTime: "Growth Time",
    bulb: "Plant Bulb",
    blooming: "Blooming Period",
    pollen: "Pollen & Pollination",
    scanNewPlant: "Scan New Plant",
    deletePlant: "Delete Plant",
    favorite: "Add to favorites",
    unfavorite: "Remove from favorites",
    share: "Share",
    linkCopied: "Link copied!",
    myNote: "My Note",
    notePlaceholder: "Write your notes about this plant…",
    saveNote: "Save Note",
    noteSaved: "Note saved",
    login: "Sign In",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    checkEmail: "Check your email",
    verificationSent: "—we sent a verification link to this address. You can sign in after clicking it.",
    backToLogin: "Back to sign in",
    errInvalidLogin: "Incorrect email or password.",
    errNotConfirmed: "Your email address is not verified yet. Check your inbox.",
    errAlreadyRegistered: "An account with this email already exists. Sign in instead.",
    errInvalidEmail: "This email address is invalid. Please enter a real address.",
    errPassword: "Password must be at least 6 characters and strong enough.",
  },
} as const;

export type TKey = keyof (typeof dict)["tr"];

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };
const Ctx = createContext<LangCtx>({ lang: "tr", setLang: () => {}, t: (k) => dict.tr[k] });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "tr") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };
  const t = (k: TKey) => dict[lang][k];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

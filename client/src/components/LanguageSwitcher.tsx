import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "si", label: "Sinhala", nativeLabel: "සිංහල" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
      <SelectTrigger className={compact ? "w-[60px] h-8 text-xs" : "w-[140px] h-9"}>
        <Globe className="h-3.5 w-3.5 mr-1 shrink-0" />
        <SelectValue>{compact ? currentLang.code.toUpperCase() : currentLang.nativeLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{lang.nativeLabel}</span>
              {!compact && <span className="text-muted-foreground text-xs">({lang.label})</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

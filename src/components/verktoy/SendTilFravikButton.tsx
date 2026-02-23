import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AttachedCalculation } from "@/components/fraviksdokumentasjon/BeregningSection";

interface SendTilFravikButtonProps {
  getCalculation: () => AttachedCalculation | null;
}

/**
 * Shown in tool pages when user navigated from fraviksdokumentasjon.
 * On click, saves the calculation result to sessionStorage and navigates back.
 */
const SendTilFravikButton = ({ getCalculation }: SendTilFravikButtonProps) => {
  const navigate = useNavigate();
  const returnData = sessionStorage.getItem("fravik-return");

  if (!returnData) return null;

  let returnUrl: string;
  let fravikIndex: number;
  try {
    const parsed = JSON.parse(returnData);
    returnUrl = parsed.returnUrl;
    fravikIndex = parsed.fravikIndex;
  } catch {
    return null;
  }

  const handleSend = () => {
    const calc = getCalculation();
    if (!calc) return;
    sessionStorage.setItem("fravik-import-calc", JSON.stringify({ calc, fravikIndex }));
    sessionStorage.removeItem("fravik-return");
    navigate(returnUrl);
  };

  const handleCancel = () => {
    sessionStorage.removeItem("fravik-return");
    navigate(returnUrl);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">Du ble sendt hit fra fraviksdokumentasjonen.</p>
      <p className="text-xs text-muted-foreground">Utfør beregningen og klikk knappen under for å sende resultatet tilbake.</p>
      <div className="flex gap-2">
        <Button onClick={handleSend} size="sm" className="flex-1">
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Send til fravik
        </Button>
        <Button onClick={handleCancel} variant="outline" size="sm">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Avbryt
        </Button>
      </div>
    </div>
  );
};

export default SendTilFravikButton;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UpdateKSButtonProps {
  conceptId: string | null;
  conceptName: string;
  conceptContent: Record<string, any>;
  disabled?: boolean;
}

const UpdateKSButton = ({ conceptId, conceptName, conceptContent, disabled }: UpdateKSButtonProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [hasActiveKS, setHasActiveKS] = useState(false);
  const [snapshotData, setSnapshotData] = useState<{ id: string; task_id: string } | null>(null);

  useEffect(() => {
    if (conceptId && user) checkActiveKS();
  }, [conceptId, user]);

  const checkActiveKS = async () => {
    if (!conceptId) return;
    // Find snapshots for this concept that have a non-completed task
    const { data } = await supabase
      .from("concept_snapshots")
      .select("id, task_id")
      .eq("concept_id", conceptId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      setHasActiveKS(false);
      return;
    }

    // Check if the task is still active (not completed)
    const { data: task } = await supabase
      .from("tasks")
      .select("id, status, assigned_to")
      .eq("id", data[0].task_id)
      .single();

    if (task) {
      setHasActiveKS(true);
      setSnapshotData(data[0]);
    } else {
      setHasActiveKS(false);
    }
  };

  const handleUpdate = async () => {
    if (!snapshotData || !user) return;
    setUpdating(true);

    // Update the snapshot content
    const { error } = await supabase
      .from("concept_snapshots")
      .update({ snapshot_content: conceptContent, snapshot_name: conceptName })
      .eq("id", snapshotData.id);

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke oppdatere KS-snapshot", variant: "destructive" });
      setUpdating(false);
      return;
    }

    // Get the task to find the assigned reviewer
    const { data: task } = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", snapshotData.task_id)
      .single();

    if (task) {
      await supabase.rpc("create_notification", {
        _user_id: task.assigned_to,
        _type: "ks_updated",
        _title: "KS oppdatert",
        _message: `Brannkonseptet "${conceptName}" har blitt oppdatert. Vennligst kontroller endringene.`,
      });
    }

    toast({ title: "Oppdatert", description: "KS-visningen er oppdatert og kontrollør er varslet" });
    setUpdating(false);
  };

  if (!hasActiveKS) return null;

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleUpdate}
      disabled={disabled || updating}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      {updating ? "Oppdaterer..." : "Oppdater KS"}
    </Button>
  );
};

export default UpdateKSButton;

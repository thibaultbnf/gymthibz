"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateOneRM } from "@/utils/oneRMCalculations";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

const oneRMFormSchema = z.object({
  oneRM: z.coerce.number().min(1, "Le 1RM doit être supérieur à 0").optional(),
  weight: z.coerce.number().min(1, "Le poids doit être supérieur à 0").optional(),
  reps: z.coerce.number().min(1, "Les répétitions doivent être supérieures à 0").optional(),
}).refine(
  (data) => data.oneRM !== undefined || (data.weight !== undefined && data.reps !== undefined),
  {
    message: "Veuillez entrer soit votre 1RM, soit le poids et les répétitions maximales.",
    path: ["oneRM"],
  }
);

type OneRMFormValues = z.infer<typeof oneRMFormSchema>;

interface OneRMCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  onOneRMCalculated: (oneRM: number) => void;
}

const OneRMCalculatorModal: React.FC<OneRMCalculatorModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  onOneRMCalculated,
}) => {
  const [loading, setLoading] = useState(false);
  const form = useForm<OneRMFormValues>({
    resolver: zodResolver(oneRMFormSchema),
    defaultValues: {
      oneRM: undefined,
      weight: undefined,
      reps: undefined,
    },
  });

  const onSubmit = (values: OneRMFormValues) => {
    setLoading(true);
    let estimatedOneRM: number | null = null;

    if (values.oneRM !== undefined && values.oneRM > 0) {
      estimatedOneRM = values.oneRM;
    } else if (values.weight !== undefined && values.reps !== undefined && values.weight > 0 && values.reps > 0) {
      estimatedOneRM = calculateOneRM(values.weight, values.reps);
    }

    if (estimatedOneRM !== null && estimatedOneRM > 0) {
      showSuccess(`1RM estimé pour ${exerciseName} : ${estimatedOneRM} kg`);
      onOneRMCalculated(estimatedOneRM);
      form.reset();
      onClose();
    } else {
      showError("Impossible de calculer le 1RM. Veuillez vérifier vos entrées.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calculer le 1RM pour {exerciseName}</DialogTitle>
          <DialogDescription>
            Entrez votre 1RM direct ou le poids et les répétitions maximales que vous pouvez effectuer pour cet exercice.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="oneRM" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="oneRM">Entrer 1RM direct</TabsTrigger>
                <TabsTrigger value="repsWeight">Calculer à partir de Répétitions/Poids</TabsTrigger>
              </TabsList>
              <TabsContent value="oneRM" className="mt-4">
                <FormField
                  control={form.control}
                  name="oneRM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre 1RM (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="Ex: 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="repsWeight" className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="Ex: 90" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Répétitions maximales</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calcul...
                  </>
                ) : (
                  "Calculer et Appliquer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OneRMCalculatorModal;
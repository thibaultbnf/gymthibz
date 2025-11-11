"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FoodEntry, FoodItem } from "@/types/workout";
import { showSuccess, showError } from "@/utils/toast";

const foodItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nom de l'aliment requis"),
  quantity: z.string().min(1, "Quantité requise"),
  calories: z.coerce.number().min(0, "Calories requises"),
  protein: z.coerce.number().min(0, "Protéines requises"),
  carbs: z.coerce.number().min(0, "Glucides requis"),
  fats: z.coerce.number().min(0, "Lipides requis"),
});

const formSchema = z.object({
  date: z.date({
    required_error: "Une date est requise.",
  }),
  items: z.array(foodItemSchema).min(1, "Au moins un aliment est requis"),
});

type FoodEntryFormValues = z.infer<typeof formSchema>;

interface AddFoodEntryFormProps {
  onAddEntry: (entry: Omit<FoodEntry, "id">) => void;
  onUpdateEntry?: (entry: FoodEntry) => void;
  initialData?: FoodEntry;
  onCancel?: () => void;
}

const AddFoodEntryForm: React.FC<AddFoodEntryFormProps> = ({
  onAddEntry,
  onUpdateEntry,
  initialData,
  onCancel,
}) => {
  const form = useForm<FoodEntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: new Date(initialData.date),
        }
      : {
          date: new Date(),
          items: [
            {
              id: crypto.randomUUID(),
              name: "",
              quantity: "",
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
            },
          ],
        },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: FoodEntryFormValues) => {
    const entryToSave: Omit<FoodEntry, "id"> = {
      date: format(values.date, "yyyy-MM-dd"),
      items: values.items.map(item => ({
        id: item.id || crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
      })),
    };

    if (initialData && onUpdateEntry) {
      await onUpdateEntry({ ...entryToSave, id: initialData.id } as FoodEntry);
      showSuccess("Entrée alimentaire mise à jour avec succès !");
    } else {
      await onAddEntry(entryToSave);
      showSuccess("Entrée alimentaire ajoutée avec succès !");
    }
    form.reset({
      date: new Date(),
      items: [
        {
          id: crypto.randomUUID(),
          name: "",
          quantity: "",
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        },
      ],
    });
    if (onCancel) onCancel();
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{initialData ? "Modifier l'entrée alimentaire" : "Ajouter une nouvelle entrée alimentaire"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {itemFields.map((item, itemIndex) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Aliment {itemIndex + 1}</h3>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(itemIndex)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'aliment
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`items.${itemIndex}.name`}
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Nom de l'aliment</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Poulet grillé" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${itemIndex}.quantity`}
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Quantité</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 150g, 1 tasse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${itemIndex}.calories`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${itemIndex}.protein`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protéines (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${itemIndex}.carbs`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Glucides (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${itemIndex}.fats`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lipides (g)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendItem({
                  id: crypto.randomUUID(),
                  name: "",
                  quantity: "",
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fats: 0,
                })
              }
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un aliment
            </Button>

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button type="submit">{initialData ? "Mettre à jour l'entrée" : "Ajouter l'entrée"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddFoodEntryForm;
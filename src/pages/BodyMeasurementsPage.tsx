"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2, Ruler, Scale } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBodyMeasurements } from "@/hooks/use-body-measurements";
import { BodyMeasurement } from "@/types/workout";
import { Loader2 } from "lucide-react";
import BodyMeasurementChart from "@/components/charts/BodyMeasurementChart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const measurementSchema = z.object({
  date: z.date({
    required_error: "Une date est requise.",
  }),
  weight_kg: z.coerce.number().min(0, "Le poids doit être positif").optional().or(z.literal(0)),
  chest_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
  waist_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
  arm_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
  leg_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
  hips_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
  neck_cm: z.coerce.number().min(0, "La mesure doit être positive").optional().or(z.literal(0)),
}).refine(
  (data) =>
    data.weight_kg > 0 ||
    data.chest_cm > 0 ||
    data.waist_cm > 0 ||
    data.arm_cm > 0 ||
    data.leg_cm > 0 ||
    data.hips_cm > 0 ||
    data.neck_cm > 0,
  {
    message: "Au moins une mensuration doit être renseignée.",
    path: ["weight_kg"], // Attach error to the first field for visibility
  }
);

type MeasurementFormValues = z.infer<typeof measurementSchema>;

const BodyMeasurementsPage: React.FC = () => {
  const { measurements, addMeasurement, deleteMeasurement, loading, error } = useBodyMeasurements();
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date(),
      weight_kg: 0,
      chest_cm: 0,
      waist_cm: 0,
      arm_cm: 0,
      leg_cm: 0,
      hips_cm: 0,
      neck_cm: 0,
    },
  });

  const onSubmit = async (values: MeasurementFormValues) => {
    const newMeasurement: Omit<BodyMeasurement, "id"> = {
      date: format(values.date, "yyyy-MM-dd"),
      weight_kg: values.weight_kg && values.weight_kg > 0 ? values.weight_kg : null,
      chest_cm: values.chest_cm && values.chest_cm > 0 ? values.chest_cm : null,
      waist_cm: values.waist_cm && values.waist_cm > 0 ? values.waist_cm : null,
      arm_cm: values.arm_cm && values.arm_cm > 0 ? values.arm_cm : null,
      leg_cm: values.leg_cm && values.leg_cm > 0 ? values.leg_cm : null,
      hips_cm: values.hips_cm && values.hips_cm > 0 ? values.hips_cm : null,
      neck_cm: values.neck_cm && values.neck_cm > 0 ? values.neck_cm : null,
    };
    await addMeasurement(newMeasurement);
    form.reset({
      date: new Date(),
      weight_kg: 0,
      chest_cm: 0,
      waist_cm: 0,
      arm_cm: 0,
      leg_cm: 0,
      hips_cm: 0,
      neck_cm: 0,
    });
    setShowAddForm(false);
  };

  const sortedMeasurements = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement des mensurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">Impossible de charger les mensurations : {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Mensurations Corporelles</h1>

      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="mb-8">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une nouvelle mensuration
        </Button>
      )}

      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ajouter une nouvelle mensuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de la mesure</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 75.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chest_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poitrine (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="waist_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taille (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arm_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bras (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 35" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="leg_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuisse (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hips_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hanches (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 95" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="neck_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cou (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Ex: 38" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer les mensurations</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Historique et Graphiques</h2>
      {measurements.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucune mensuration enregistrée pour le moment. Ajoutez votre première mesure !
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du Poids</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMeasurementChart measurements={measurements} dataKey="weight_kg" title="Poids" unit="kg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Taille</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMeasurementChart measurements={measurements} dataKey="waist_cm" title="Taille" unit="cm" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Poitrine</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMeasurementChart measurements={measurements} dataKey="chest_cm" title="Poitrine" unit="cm" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Bras</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMeasurementChart measurements={measurements} dataKey="arm_cm" title="Bras" unit="cm" />
            </CardContent>
          </Card>
          {/* Add more charts for other measurements as needed */}
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Toutes les Mensurations</h2>
      <div className="grid grid-cols-1 gap-6">
        {sortedMeasurements.map((measurement) => (
          <Card key={measurement.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                Mensurations du {format(new Date(measurement.date), "PPP", { locale: fr })}
              </CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cela supprimera définitivement cette entrée de mensurations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMeasurement(measurement.id)}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {measurement.weight_kg !== null && measurement.weight_kg > 0 && (
                <div>
                  <CardDescription>Poids</CardDescription>
                  <p className="text-lg font-semibold">{measurement.weight_kg} kg</p>
                </div>
              )}
              {measurement.chest_cm !== null && measurement.chest_cm > 0 && (
                <div>
                  <CardDescription>Poitrine</CardDescription>
                  <p className="text-lg font-semibold">{measurement.chest_cm} cm</p>
                </div>
              )}
              {measurement.waist_cm !== null && measurement.waist_cm > 0 && (
                <div>
                  <CardDescription>Taille</CardDescription>
                  <p className="text-lg font-semibold">{measurement.waist_cm} cm</p>
                </div>
              )}
              {measurement.arm_cm !== null && measurement.arm_cm > 0 && (
                <div>
                  <CardDescription>Bras</CardDescription>
                  <p className="text-lg font-semibold">{measurement.arm_cm} cm</p>
                </div>
              )}
              {measurement.leg_cm !== null && measurement.leg_cm > 0 && (
                <div>
                  <CardDescription>Cuisse</CardDescription>
                  <p className="text-lg font-semibold">{measurement.leg_cm} cm</p>
                </div>
              )}
              {measurement.hips_cm !== null && measurement.hips_cm > 0 && (
                <div>
                  <CardDescription>Hanches</CardDescription>
                  <p className="text-lg font-semibold">{measurement.hips_cm} cm</p>
                </div>
              )}
              {measurement.neck_cm !== null && measurement.neck_cm > 0 && (
                <div>
                  <CardDescription>Cou</CardDescription>
                  <p className="text-lg font-semibold">{measurement.neck_cm} cm</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BodyMeasurementsPage;
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const schema = z.object({
  guestName: z
    .string()
    .min(1, "Укажите имя")
    .max(200, "Имя не длиннее 200 символов"),
});

export default function BookingForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (name: string) => void;
  isPending: boolean;
}) {
  const form = useForm<{ guestName: string }>({
    resolver: zodResolver(schema),
    defaultValues: { guestName: "" },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values.guestName))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="guestName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваше имя</FormLabel>
              <FormControl>
                <Input placeholder="Иван" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Запись…" : "Записаться"}
        </Button>
      </form>
    </Form>
  );
}

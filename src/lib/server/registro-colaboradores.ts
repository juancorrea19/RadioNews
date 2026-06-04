import { createSupabaseAdminClient } from "./supabase";

const TABLE = "registro_colaboradores";

export interface RegistroColaboradorRecord {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  interes: string;
  mensaje: string | null;
  autoriza_correo: boolean;
  created_at: string;
}

function getAdmin() {
  return createSupabaseAdminClient();
}

export async function insertRegistroColaborador(input: {
  nombre: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  interes: string;
  mensaje?: string;
  autorizaCorreo: boolean;
}): Promise<{ id: string }> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nombre: input.nombre.trim(),
      correo: input.correo.trim(),
      telefono: input.telefono.trim(),
      ubicacion: input.ubicacion.trim(),
      interes: input.interes.trim(),
      mensaje: input.mensaje?.trim() || null,
      autoriza_correo: input.autorizaCorreo,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string };
}

export async function listRegistroColaboradoresForAdmin(): Promise<RegistroColaboradorRecord[]> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []) as RegistroColaboradorRecord[];
}

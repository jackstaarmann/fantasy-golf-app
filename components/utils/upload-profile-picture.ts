import supabase from "@/supabase";

export async function uploadProfilePicture(
  userId: string,
  uri: string
) {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const filePath = `${userId}/profile-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    console.error("Profile upload failed:", error);
    return null;
  }
}
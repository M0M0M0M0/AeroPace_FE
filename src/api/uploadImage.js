import axiosClient from "./axiosClient";

/**
 * Upload một file ảnh lên Cloudinary qua backend.
 * @param {File} file
 * @param {"avatar"|"review-image"} type
 * @returns {Promise<string>} secure_url của ảnh đã upload
 */
export async function uploadImage(file, type = "review-image") {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosClient.post(`/uploads/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.url;
}

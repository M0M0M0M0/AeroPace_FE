import axiosClient from "./axiosClient";

export async function uploadImage(file, type = "review-image") {
  const formData = new FormData();
  formData.append("file", file);

  // Do not set Content-Type manually — let browser/axios add the multipart boundary,
  // otherwise the server cannot parse the file part.
  const { data } = await axiosClient.post(`/uploads/${type}`, formData);

  return data.url;
}


import axiosClient from "../api/axiosClient";

const documentService = {
  async create(formData) {
    const res = await axiosClient.post("documents/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
  async update (id, formData){
    const res = await axiosClient.patch(`documents/${id}/`, formData);
    return res.data;
  },
  async delete (id){
    const res = await axiosClient.delete(`documents/${id}/`);
    return  res.data;
  },
  async confirm (id){
    const res = await axiosClient.patch(`documents/${id}/`, 
      {
        status: "FINAL",
      }
    );
    return res.data;
  },
  async decline (id) {
    const res = await axiosClient.patch(`documents/${id}/`, 
      {
        status: "REJECTED",
      }
    );
    return res.data;
  }
}
export default documentService;
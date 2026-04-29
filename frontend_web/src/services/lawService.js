import axiosClient from "../api/axiosClient";

const lawService = {
    async getAllReferences() {
        const res = await axiosClient.get("law-references/");
        return res.data;
    },

    async uploadLawFile(payload) {
        const formData = new FormData();
        
        formData.append('file', payload.file);
        formData.append('law_name', payload.lawName);

        if (payload.category) formData.append('category', payload.category);
        if (payload.description) formData.append('description', payload.description);
        if (payload.effectiveDate) formData.append('effective_date', payload.effectiveDate);
        
        if (payload.isActive !== undefined) {
            formData.append('is_active', payload.isActive);
        }

        const res = await axiosClient.post("upload-law/", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return res.data;
    },

    async createKnowledgeChunk(value) {
        const res = await axiosClient.post("law-chunks/", value);
        return res.data;
    },
    
    async updateLawReference(id, updateData) {
        const res = await axiosClient.patch(`law-references/${id}/`, updateData);
        return res.data;
    },

    async deleteLaw(id) {
        const res = await axiosClient.delete(`law-references/${id}/`);
        return res.data;
    }
};

export default lawService;
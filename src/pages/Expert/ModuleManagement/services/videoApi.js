import api from "../../../../utils/api";

export const getVideoDetail = async (materialId) => {
    const response = await api.get(
        `/video-materials/${materialId}`
    );

    return response.data;
};

export const updateVideoDetail = async (
    materialId,
    payload
) => {

    const response = await api.put(
        `/video-materials/${materialId}`,
        payload
    );

    return response.data;
};
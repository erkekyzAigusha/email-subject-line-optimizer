import api from './api';

/* ── Auth ──────────────────────────────────────── */
export const login = (email, password) =>
    api.post('auth/login/', { email, password });

export const register = (data) =>
    api.post('auth/register/', data);

export const getProfile = () =>
    api.get('auth/profile/');

export const updateProfile = (data) =>
    api.patch('auth/profile/', data);

export const changePassword = (data) =>
    api.post('auth/change-password/', data);

/* ── Campaigns ─────────────────────────────────── */
export const getCampaigns = () =>
    api.get('campaigns/');

export const getCampaign = (id) =>
    api.get(`campaigns/${id}/`);

export const createCampaign = (data) =>
    api.post('campaigns/', data);

export const updateCampaign = (id, data) =>
    api.patch(`campaigns/${id}/`, data);

export const deleteCampaign = (id) =>
    api.delete(`campaigns/${id}/`);

export const generateSubjects = (id) =>
    api.post(`campaigns/${id}/generate/`);

/* ── Subject Lines ─────────────────────────────── */
export const getSubjectLines = (campaignId) =>
    api.get(`campaigns/${campaignId}/subjects/`);

export const createSubjectLine = (campaignId, data) =>
    api.post(`campaigns/${campaignId}/subjects/`, data);

export const updateSubjectLine = (id, data) =>
    api.patch(`subjects/${id}/`, data);

export const deleteSubjectLine = (id) =>
    api.delete(`subjects/${id}/`);

/* ── Chat ──────────────────────────────────────── */
export const getChatSessions = () =>
    api.get('chat/sessions/');

export const getChatSession = (id) =>
    api.get(`chat/sessions/${id}/`);

export const createChatSession = (data = {}) =>
    api.post('chat/sessions/', data);

export const deleteChatSession = (id) =>
    api.delete(`chat/sessions/${id}/`);

export const sendMessage = (sessionId, prompt) =>
    api.post(`chat/sessions/${sessionId}/send/`, { prompt });

/* ── Admin ─────────────────────────────────────── */
export const adminGetUsers = (params = {}) =>
    api.get('admin/users/', { params });

export const adminGetUser = (id) =>
    api.get(`admin/users/${id}/`);

export const adminBlockUser = (id, block) =>
    api.post(`admin/users/${id}/block/`, { block });

export const adminGetCampaigns = (params = {}) =>
    api.get('admin/campaigns/', { params });

export const adminGetCampaign = (id) =>
    api.get(`admin/campaigns/${id}/`);

export const adminUpdateCampaign = (id, data) =>
    api.patch(`admin/campaigns/${id}/`, data);

export const adminDeleteCampaign = (id) =>
    api.delete(`admin/campaigns/${id}/`);

export const adminGetSubjects = (params = {}) =>
    api.get('admin/subjects/', { params });

export const adminUpdateSubject = (id, data) =>
    api.patch(`admin/subjects/${id}/`, data);

export const adminDeleteSubject = (id) =>
    api.delete(`admin/subjects/${id}/`);

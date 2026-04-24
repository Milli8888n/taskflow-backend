import { fetchAPI } from '../api/apiClient.js';

/**
 * Lấy danh sách lời mời của tôi
 */
export const getMyInvitations = async () => {
  return await fetchAPI('/invitations');
};

/**
 * Gửi lời mời tham gia dự án
 */
export const sendInvitation = async (projectId, email) => {
  return await fetchAPI(`/invitations/${projectId}`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * Phản hồi lời mời (accept/decline)
 */
export const respondToInvitation = async (invitationId, response) => {
  return await fetchAPI(`/invitations/${invitationId}/respond`, {
    method: 'PATCH',
    body: JSON.stringify({ response })
  });
};

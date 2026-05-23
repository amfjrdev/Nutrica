const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// POST /api/auth/login — Step 1: validate credentials, triggers OTP email
export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
  // Returns OtpPendingResult: { email, message }
};

// POST /api/auth/verify-otp — Step 2: verify OTP, receive JWT
export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
  // Returns AuthResult: { userId, email, firstName, lastName, role, token }
};

// POST /api/auth/resend-otp — resend OTP (60s cooldown)
export const resendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// POST /api/auth/register
export const register = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // AuthResult
};

// GET /api/clients/access
export const getClientAccess = async () => {
  const res = await fetch(`${BASE_URL}/clients/access`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // ClientAccessDto
};

// GET /api/clients/me
export const getClientProfile = async () => {
  const res = await fetch(`${BASE_URL}/clients/me`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); 
};

// GET /api/nutrition-plans/client/my
export const getMyPlansAsClient = async () => {
  const res = await fetch(`${BASE_URL}/nutrition-plans/client/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); 
};

// POST /api/feedbacks
export const submitFeedback = async (nutritionPlanId, comment, rating) => {
  const res = await fetch(`${BASE_URL}/feedbacks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nutritionPlanId, comment, rating }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// GET /api/feedbacks/plan/{planId}
export const getFeedbacksByPlan = async (planId) => {
  const res = await fetch(`${BASE_URL}/feedbacks/plan/${planId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); 
};

// GET /api/feedbacks/my (NutritionistOnly)
export const getMyFeedbacksAsNutritionist = async () => {
  const res = await fetch(`${BASE_URL}/feedbacks/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
};

// POST /api/feedbacks/nutritionist
export const rateNutritionist = async (nutritionistId, rating, comment) => {
  const res = await fetch(`${BASE_URL}/feedbacks/nutritionist`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify({ nutritionistId, rating, comment }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// GET /api/feedbacks/nutritionist/{nutritionistId}/my
export const getMyNutritionistRating = async (nutritionistId) => {
  const res = await fetch(`${BASE_URL}/feedbacks/nutritionist/${nutritionistId}/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
};

// POST /api/ai/chat
export const aiChat = async (message) => {
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); 
};

// POST /api/ai/estimate-calories (multipart/form-data)
export const estimateCalories = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const res = await fetch(`${BASE_URL}/ai/estimate-calories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { foodName, estimatedCalories, details }
};

// GET /api/posts (anonymous - approved posts)
export const getApprovedPosts = async () => {
  const res = await fetch(`${BASE_URL}/posts`);
  if (!res.ok) {
    const text = await res.text();
    try { throw JSON.parse(text); } catch { throw new Error(`HTTP ${res.status}: ${text}`); }
  }
  return res.json(); // PostDto[]
};

// POST /api/payments/mock (DEV ONLY — no Stripe)
export const mockPayment = async (data) => {
  const res = await fetch(`${BASE_URL}/payments/mock`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // Guid
};

// POST /api/payments/initiate
export const initiatePayment = async (data) => {
  const res = await fetch(`${BASE_URL}/payments/initiate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { clientSecret, paymentId, subscriptionId }
};

// GET /api/payments/my
export const getMyPayments = async () => {
  const res = await fetch(`${BASE_URL}/payments/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
};

// GET /api/subscriptions/my
export const getMySubscription = async () => {
  const res = await fetch(`${BASE_URL}/subscriptions/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // SubscriptionDto
};

// PUT /api/subscriptions/{id}/cancel
export const cancelSubscription = async (id) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
};

// PUT /api/clients/questionnaire
export const updateQuestionnaire = async (data) => {
  const res = await fetch(`${BASE_URL}/clients/questionnaire`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
};

// GET /api/appointments/my
export const getMyAppointments = async () => {
  const res = await fetch(`${BASE_URL}/appointments/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // AppointmentDto[]
};

// GET /api/appointments/available/{nutritionistId}
export const getAvailableSlots = async (nutritionistId) => {
  const res = await fetch(`${BASE_URL}/appointments/available/${nutritionistId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // AvailableSlotDto[]
};

// POST /api/appointments
export const requestAppointment = async (nutritionistId, scheduledAt, notes) => {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nutritionistId, scheduledAt, notes }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // Guid
};

// PUT /api/appointments/{id}/cancel
export const cancelAppointment = async (id) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}/cancel`, {
    method: 'PUT', headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
};

// --- Nutritionist endpoints ---

// GET /api/nutritionists/me
export const getNutritionistProfile = async () => {
  const res = await fetch(`${BASE_URL}/nutritionists/me`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // NutritionistDto
};

// GET /api/nutritionists/clients
export const getNutritionistClients = async () => {
  const res = await fetch(`${BASE_URL}/nutritionists/clients`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // ClientSummaryDto[]
};

// GET /api/nutritionists/chat-clients
export const getNutritionistChatClients = async () => {
  const res = await fetch(`${BASE_URL}/nutritionists/chat-clients`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // PersonalizedClientDto[]
};

// GET /api/nutritionists/clients/{clientId}/questionnaire
export const getClientQuestionnaire = async (clientId) => {
  const res = await fetch(`${BASE_URL}/nutritionists/clients/${clientId}/questionnaire`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // ClientQuestionnaireDto
};

// GET /api/appointments/dashboard (nutritionist — enriched with client names)
export const getNutritionistDashboard = async () => {
  const res = await fetch(`${BASE_URL}/appointments/dashboard`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // AppointmentWithClientDto[]
};

// GET /api/appointments/my (nutritionist)
export const getNutritionistAppointments = async () => {
  const res = await fetch(`${BASE_URL}/appointments/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // AppointmentDto[]
};

// PUT /api/appointments/{id}/approve
export const approveAppointment = async (id) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}/approve`, {
    method: 'PUT', headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
};

// PUT /api/appointments/{id}/reject
export const rejectAppointment = async (id, reason) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}/reject`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw await res.json();
};

// POST /api/nutrition-plans (nutritionist creates plan for client)
export const createNutritionPlan = async (data) => {
  const res = await fetch(`${BASE_URL}/nutrition-plans`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // Guid
};

// GET /api/nutrition-plans/my (nutritionist)
export const getMyPlansAsNutritionist = async () => {
  const res = await fetch(`${BASE_URL}/nutrition-plans/my`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // NutritionPlanDto[]
};

// PUT /api/nutritionists/profile
export const updateNutritionistProfile = async (data) => {
  const res = await fetch(`${BASE_URL}/nutritionists/profile`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
};

// POST /api/posts
export const createPost = async (data) => {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST', headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    try { throw JSON.parse(text); } catch { throw new Error(`HTTP ${res.status}: ${text}`); }
  }
  return res.json();
};

// --- Admin endpoints ---

// GET /api/users (AdminOnly)
export const getAllUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // UserDto[]
};

// PUT /api/users/{id}/suspend
export const suspendUser = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}/suspend`, { method: 'PUT', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// PUT /api/users/{id}/activate
export const activateUser = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}/activate`, { method: 'PUT', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// GET /api/subscriptions (AdminOnly)
export const getAllSubscriptions = async () => {
  const res = await fetch(`${BASE_URL}/subscriptions`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // SubscriptionDto[]
};

// GET /api/payments/pending (AdminOnly)
export const getPendingPayments = async () => {
  const res = await fetch(`${BASE_URL}/payments/pending`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
};

// PUT /api/payments/{id}/approve (AdminOnly)
export const approvePayment = async (id) => {
  const res = await fetch(`${BASE_URL}/payments/${id}/approve`, { method: 'PUT', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// GET /api/payments (AdminOnly)
export const getAllPayments = async () => {
  const res = await fetch(`${BASE_URL}/payments`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // PaymentDto[]
};

// GET /api/nutrition-plans/pending (AdminOnly)
export const getPendingPlans = async () => {
  const res = await fetch(`${BASE_URL}/nutrition-plans/pending`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // NutritionPlanDto[]
};

// PUT /api/nutrition-plans/{id}/approve
export const approvePlan = async (id) => {
  const res = await fetch(`${BASE_URL}/nutrition-plans/${id}/approve`, { method: 'PUT', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// PUT /api/nutrition-plans/{id}/reject
export const rejectPlan = async (id, reason) => {
  const res = await fetch(`${BASE_URL}/nutrition-plans/${id}/reject`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw await res.json();
};

// GET /api/posts/pending (AdminOnly)
export const getPendingPosts = async () => {
  const res = await fetch(`${BASE_URL}/posts/pending`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // PostDto[]
};

// GET /api/posts/all (AdminOnly)
export const getAllPosts = async () => {
  const res = await fetch(`${BASE_URL}/posts/all`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // PostDto[]
};

// DELETE /api/posts/{id} (AdminOnly)
export const deletePost = async (id) => {
  const res = await fetch(`${BASE_URL}/posts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// PUT /api/posts/{id}/approve
export const approvePost = async (id) => {
  const res = await fetch(`${BASE_URL}/posts/${id}/approve`, { method: 'PUT', headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
};

// PUT /api/posts/{id}/reject
export const rejectPost = async (id, reason) => {
  const res = await fetch(`${BASE_URL}/posts/${id}/reject`, {
    method: 'PUT', headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw await res.json();
};

// --- Notification endpoints ---

// GET /api/notifications
export const getMyNotifications = async () => {
  const res = await fetch(`${BASE_URL}/notifications`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json(); // NotificationDto[]
};

// PUT /api/notifications/{id}/read
export const markNotificationRead = async (id) => {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw await res.json();
};

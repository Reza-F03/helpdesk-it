const supabase = require('../config/supabase');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password.helper');
const { generateToken } = require('../utils/jwt.helper');
const { successResponse, errorResponse } = require('../utils/response.helper');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, password, full_name, email, role, phone, department } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return errorResponse(res, passwordValidation.message, 400);
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return errorResponse(res, 'Username already taken', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          password: hashedPassword,
          full_name,
          email,
          role: role || 'client', // Default role is client
          phone,
          department,
          is_active: true
        }
      ])
      .select('id, username, full_name, email, role, phone, department, is_active, created_at')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return errorResponse(res, 'Failed to create user', 500);
    }

    // Generate token
    const token = generateToken(newUser);

    return successResponse(
      res,
      {
        user: newUser,
        token
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (findError || !user) {
      return errorResponse(res, 'Invalid username or password', 401);
    }

    // Check if user is active
    if (!user.is_active) {
      return errorResponse(res, 'Account is inactive. Please contact administrator.', 403);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid username or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    delete user.password;

    return successResponse(
      res,
      {
        user,
        token
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, phone, department, is_active, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Update current user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, phone, department } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, full_name, email, role, phone, department, is_active, updated_at')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return errorResponse(res, 'Failed to update profile', 500);
    }

    return successResponse(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Get current user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (findError || !user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(current_password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(new_password);
    if (!passwordValidation.valid) {
      return errorResponse(res, passwordValidation.message, 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Update password error:', updateError);
      return errorResponse(res, 'Failed to change password', 500);
    }

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};

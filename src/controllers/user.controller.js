const supabase = require('../config/supabase');
const { hashPassword, validatePasswordStrength } = require('../utils/password.helper');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.helper');

/**
 * Get all users with pagination and filters
 * GET /api/users
 * Query params: page, limit, role, is_active, search
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      is_active,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('users')
      .select('id, username, full_name, email, role, phone, department, is_active, created_at, updated_at', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Get users error:', error);
      return errorResponse(res, 'Failed to retrieve users', 500);
    }

    return paginatedResponse(
      res,
      users,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      },
      'Users retrieved successfully'
    );
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, phone, department, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Create new user (Admin only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role, phone, department, is_active } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return errorResponse(res, passwordValidation.message, 400);
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
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
          email,
          password: hashedPassword,
          full_name,
          role: role || 'client',
          phone,
          department,
          is_active: is_active !== undefined ? is_active : true
        }
      ])
      .select('id, username, full_name, email, role, phone, department, is_active, created_at')
      .single();

    if (insertError) {
      console.error('Insert user error:', insertError);
      return errorResponse(res, 'Failed to create user', 500);
    }

    return successResponse(res, newUser, 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, full_name, role, phone, department, is_active, password, email } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }

    // Build update data
    const updateData = {};
    if (username !== undefined && username !== existingUser.username) {
      // Check if username already taken
      const { data: takenUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
      if (takenUser) {
        return errorResponse(res, 'Username already taken', 400);
      }
      updateData.username = username;
    }
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update password if provided
    if (password) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return errorResponse(res, passwordValidation.message, 400);
      }
      updateData.password = await hashPassword(password);
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, full_name, email, role, phone, department, is_active, updated_at')
      .single();

    if (error) {
      console.error('Update user error:', error);
      return errorResponse(res, 'Failed to update user', 500);
    }

    return successResponse(res, updatedUser, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent self-deletion
    if (id === currentUserId) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return errorResponse(res, 'User not found', 404);
    }

    // Delete user (cascade will handle related records)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return errorResponse(res, 'Failed to delete user', 500);
    }

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get users by role
 * GET /api/users/role/:role
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const validRoles = ['admin', 'client', 'support'];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, phone, department, is_active')
      .eq('role', role)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Get users by role error:', error);
      return errorResponse(res, 'Failed to retrieve users', 500);
    }

    return successResponse(res, users, `${role} users retrieved successfully`);
  } catch (error) {
    console.error('Get users by role error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get user statistics (Admin only)
 * GET /api/users/stats
 */
const getUserStats = async (req, res) => {
  try {
    // Count users by role
    const { data: stats, error } = await supabase
      .from('users')
      .select('role, is_active');

    if (error) {
      console.error('Get user stats error:', error);
      return errorResponse(res, 'Failed to retrieve statistics', 500);
    }

    const statistics = {
      total_users: stats.length,
      active_users: stats.filter(u => u.is_active).length,
      inactive_users: stats.filter(u => !u.is_active).length,
      by_role: {
        admin: stats.filter(u => u.role === 'admin').length,
        support: stats.filter(u => u.role === 'support').length,
        client: stats.filter(u => u.role === 'client').length
      }
    };

    return successResponse(res, statistics, 'User statistics retrieved successfully');
  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUserStats
};

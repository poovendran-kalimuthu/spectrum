import User from '../models/User.js';

export const loginSuccess = (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: 'Successfully logged in',
      user: req.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not Authorized'
    });
  }
};

export const loginFailed = (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Log in failure'
  });
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }
    // Destroy the session and clear the cookie
    req.session.destroy();
    res.clearCookie('token');
    // Redirect user back to the login page on the frontend
    res.redirect(process.env.FRONTEND_URL);
  });
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not Authorized' });
    }

    const { name, registerNumber, department, year, section, mobile, alternateEmail, subRole, assignedMentor } = req.body;

    // Fetch current user to preserve admin-assigned roles
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Only update role-related fields when user has a base 'user'/'mentor' role
    // (never downgrade admin accounts via profile update)
    const isBaseUser = ['user', 'mentor'].includes(currentUser.role);
    const effectiveRole = isBaseUser
      ? (subRole === 'mentor' ? 'mentor' : 'user')
      : currentUser.role;

    const mentorStatus = isBaseUser && subRole === 'mentor'
      ? (currentUser.mentorStatus || 'pending')  // keep existing approval if re-saving
      : currentUser.mentorStatus;

    const updateFields = {
      name,
      registerNumber,
      department,
      year,
      section,
      mobile,
      alternateEmail: alternateEmail || '',
      isProfileComplete: true,
    };

    if (isBaseUser) {
      updateFields.role = effectiveRole;
      updateFields.subRole = subRole || null;
      updateFields.assignedMentor = (subRole === 'student' && assignedMentor) ? assignedMentor : null;
      updateFields.mentorStatus = mentorStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('assignedMentor', 'name email department');

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


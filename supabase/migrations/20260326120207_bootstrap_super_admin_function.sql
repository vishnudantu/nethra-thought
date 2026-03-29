/*
  # Bootstrap Super Admin Function

  Creates a secure function that allows the very first user to register
  as super_admin automatically if no super_admin exists yet.
  This solves the chicken-and-egg problem of needing a super_admin 
  to create other users, but needing a user to become super_admin.

  The function `bootstrap_super_admin(user_id)` can be called once
  to assign the caller as super_admin if no super_admins exist.
*/

CREATE OR REPLACE FUNCTION bootstrap_super_admin(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
  result json;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM user_roles 
  WHERE role = 'super_admin';
  
  IF admin_count > 0 THEN
    RETURN json_build_object('success', false, 'message', 'Super admin already exists');
  END IF;

  INSERT INTO user_roles (user_id, role, politician_id)
  VALUES (p_user_id, 'super_admin', NULL)
  ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', politician_id = NULL;

  RETURN json_build_object('success', true, 'message', 'Super admin created successfully');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION bootstrap_super_admin(uuid) TO authenticated;

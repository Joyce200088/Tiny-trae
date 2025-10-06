-- 创建 set_config 函数，用于设置 PostgreSQL 会话变量
-- 这个函数用于支持 RLS 策略中的用户上下文设置

CREATE OR REPLACE FUNCTION set_config(
  setting_name text,
  new_value text,
  is_local boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 设置 PostgreSQL 配置参数
  PERFORM set_config(setting_name, new_value, is_local);
  
  -- 返回设置的值
  RETURN new_value;
END;
$$;

-- 授予执行权限给认证用户
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO anon;

-- 验证函数创建成功
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'set_config' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
import requests
import os

def test_python_service():
    """测试Python服务直接调用"""
    print("测试Python服务 (http://localhost:8000/remove-background)...")
    
    try:
        with open('public/test-image.png', 'rb') as f:
            files = {'file': ('test-image.png', f, 'image/png')}
            response = requests.post('http://localhost:8000/remove-background', files=files)
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {response.headers}")
        
        if response.status_code == 200:
            with open('test-python-output.png', 'wb') as f:
                f.write(response.content)
            print("✅ Python服务测试成功！输出保存为 test-python-output.png")
        else:
            print(f"❌ Python服务测试失败: {response.text}")
            
    except Exception as e:
        print(f"❌ Python服务测试异常: {e}")

def test_nextjs_api():
    """测试Next.js API路由"""
    print("\n测试Next.js API (http://localhost:3000/api/bg/remove)...")
    
    try:
        with open('public/test-image.png', 'rb') as f:
            files = {'file': ('test-image.png', f, 'image/png')}
            response = requests.post('http://localhost:3000/api/bg/remove', files=files)
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {response.headers}")
        
        if response.status_code == 200:
            with open('test-nextjs-output.png', 'wb') as f:
                f.write(response.content)
            print("✅ Next.js API测试成功！输出保存为 test-nextjs-output.png")
        else:
            print(f"❌ Next.js API测试失败: {response.text}")
            
    except Exception as e:
        print(f"❌ Next.js API测试异常: {e}")

if __name__ == "__main__":
    # 检查测试图片是否存在
    if not os.path.exists('public/test-image.png'):
        print("❌ 测试图片不存在: public/test-image.png")
        exit(1)
    
    test_python_service()
    test_nextjs_api()
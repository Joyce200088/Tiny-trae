// 垃圾桶自动清理工具
export class TrashCleanup {
  private static readonly RETENTION_DAYS = 30;
  private static readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * 启动自动清理定时器
   */
  static startAutoCleanup() {
    // 如果已经有定时器在运行，先清除
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 立即执行一次清理
    this.cleanupExpiredItems();

    // 设置定时器，每24小时执行一次清理
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredItems();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 停止自动清理定时器
   */
  static stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 清理过期的垃圾桶项目
   */
  static cleanupExpiredItems() {
    try {
      const trashWorlds = JSON.parse(localStorage.getItem('trashWorlds') || '[]');
      const now = new Date();
      
      // 过滤出未过期的项目
      const validWorlds = trashWorlds.filter((world: any) => {
        const deletedAt = new Date(world.deletedAt);
        const daysDiff = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff < this.RETENTION_DAYS;
      });

      // 如果有项目被清理，更新localStorage
      if (validWorlds.length !== trashWorlds.length) {
        localStorage.setItem('trashWorlds', JSON.stringify(validWorlds));
        console.log(`垃圾桶自动清理：删除了 ${trashWorlds.length - validWorlds.length} 个过期项目`);
      }
    } catch (error) {
      console.error('垃圾桶自动清理失败:', error);
    }
  }

  /**
   * 获取即将过期的项目数量（7天内过期）
   */
  static getExpiringItemsCount(): number {
    try {
      const trashWorlds = JSON.parse(localStorage.getItem('trashWorlds') || '[]');
      const now = new Date();
      
      return trashWorlds.filter((world: any) => {
        const deletedAt = new Date(world.deletedAt);
        const daysDiff = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= (this.RETENTION_DAYS - 7) && daysDiff < this.RETENTION_DAYS;
      }).length;
    } catch (error) {
      console.error('获取即将过期项目数量失败:', error);
      return 0;
    }
  }

  /**
   * 手动清理所有过期项目
   */
  static manualCleanup(): number {
    try {
      const trashWorlds = JSON.parse(localStorage.getItem('trashWorlds') || '[]');
      const now = new Date();
      
      const validWorlds = trashWorlds.filter((world: any) => {
        const deletedAt = new Date(world.deletedAt);
        const daysDiff = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff < this.RETENTION_DAYS;
      });

      const cleanedCount = trashWorlds.length - validWorlds.length;
      localStorage.setItem('trashWorlds', JSON.stringify(validWorlds));
      
      return cleanedCount;
    } catch (error) {
      console.error('手动清理失败:', error);
      return 0;
    }
  }
}

// 在浏览器环境中自动启动清理
if (typeof window !== 'undefined') {
  // 页面加载时启动自动清理
  TrashCleanup.startAutoCleanup();
  
  // 页面卸载时停止清理
  window.addEventListener('beforeunload', () => {
    TrashCleanup.stopAutoCleanup();
  });
}
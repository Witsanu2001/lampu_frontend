import { useState } from "react";

export default function UserSetting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const users = [
    {
      id: 1,
      name: "สมชาย ใจดี",
      email: "somchai@example.com",
      role: "admin",
      provider: "email",
      createdAt: "2024-01-10",
      lastLogin: "2024-01-15",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      id: 2,
      name: "วิภา สุขใจ",
      email: "wipa@example.com",
      role: "user",
      provider: "line",
      createdAt: "2024-01-12",
      lastLogin: "2024-01-15",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      id: 3,
      name: "นิติ รักษ์ดี",
      email: "niti@example.com",
      role: "user",
      provider: "facebook",
      createdAt: "2024-01-13",
      lastLogin: "2024-01-14",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: 4,
      name: "มานี มีสุข",
      email: "manee@example.com",
      role: "user",
      provider: "email",
      createdAt: "2024-01-14",
      lastLogin: "2024-01-15",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    {
      id: 5,
      name: "ประยุทธ์ มั่นคง",
      email: "prayut@example.com",
      role: "admin",
      provider: "email",
      createdAt: "2024-01-08",
      lastLogin: "2024-01-13",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
      case "user":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "line":
        return "💚";
      case "facebook":
        return "📘";
      case "email":
        return "📧";
      default:
        return "👤";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    user: users.filter((u) => u.role === "user").length,
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          จัดการผู้ใช้งาน
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          จัดการสิทธิ์และข้อมูลผู้ใช้งานในระบบ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👥</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +12%
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">
            ผู้ใช้งานทั้งหมด
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {users.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👑</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Admin
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">
            ผู้ดูแลระบบ
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {roleCounts.admin}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👤</span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              User
            </span>
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">
            ผู้ใช้ทั่วไป
          </h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {roleCounts.user}
          </p>
        </div>
      </div>

      {/* Role Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: "all", label: "ทั้งหมด" },
            { key: "admin", label: "Admin" },
            { key: "user", label: "User" },
          ].map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role.key
                  ? "bg-emerald-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {role.label} ({roleCounts[role.key as keyof typeof roleCounts]})
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  วิธีการเข้าสู่ระบบ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  สร้างเมื่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  เข้าสู่ระบบล่าสุด
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        user.role,
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-1">{getProviderIcon(user.provider)}</span>
                    {user.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg transition-colors">
                        แก้ไข
                      </button>
                      <button className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg transition-colors">
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              ไม่พบผู้ใช้งาน
            </p>
          </div>
        )}
      </div>

      {/* Add User Modal Placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              เพิ่มผู้ใช้ใหม่
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ฟอร์มเพิ่มผู้ใช้จะถูกเพิ่มที่นี่
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

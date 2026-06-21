/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUser } from "../../api/api_user";

export default function UserSetting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const navigate = useNavigate();

  // State หลักสำหรับจัดการข้อมูล
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🌟 State สำหรับ Modal แก้ไขบทบาท
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 State สำหรับ Modal ลบผู้ใช้งาน
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockingUser, setBlockingUser] = useState<any>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState<any>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  // State สำหรับดูรูปภาพ
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // ค่า URL และ Token สำหรับยิง API (ปรับให้ตรงกับโปรเจกต์ของคุณ)
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const getToken = () =>
    localStorage.getItem("auth_token") ||
    localStorage.getItem("firebase_token") ||
    "";

  // ดึงข้อมูลผู้ใช้งานเริ่มต้น
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllUser();
        if (isMounted) {
          const formattedUsers = (data || []).map((user: any) => ({
            id: user.uid,
            name: user.displayName || "ไม่ระบุชื่อ",
            email: user.email || "-",
            role: user.role || "user",
            provider: user.provider || "email",
            is_blocked: user.is_blocked || false, // ดึงสถานะบล็อคมาด้วย
            createdAt: "-",
            lastLogin: user.lastLogin
              ? new Date(user.lastLogin).toLocaleDateString("th-TH")
              : "-",
            avatar:
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=random`,
          }));
          setUsers(formattedUsers);
        }
      } catch (err: any) {
        if (isMounted)
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // ฟังก์ชันย่อยสำหรับ UI
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
      case "user":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "rider":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case "line":
        return "💚";
      case "facebook":
        return "📘";
      case "google":
        return "🔴";
      case "email":
      case "password":
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
    rider: users.filter((u) => u.role === "rider").length,
  };

  /// ==========================================
  // 🚀 ACTION HANDLERS (เชื่อม API จริง)
  // ==========================================

  // 1. บันทึกการแก้ไขบทบาท
  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/all/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ uid: editingUser.id, role: newRole }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to edit user");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, role: newRole } : u,
        ),
      );
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. ยืนยันการลบ
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/all/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ uid: deletingUser.id }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 🌟 3. ยืนยันการบล็อค (เพิ่มฟังก์ชันนี้เข้าไป)
  const handleConfirmBlock = async () => {
    if (!blockingUser) return;
    setIsBlocking(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/all/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ uid: blockingUser.id }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to block user");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === blockingUser.id ? { ...u, is_blocked: true } : u,
        ),
      );
      setIsBlockModalOpen(false); // ปิด Modal บล็อค
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsBlocking(false);
    }
  };

  // 4. ยืนยันการปลดบล็อค
  const handleConfirmUnblock = async () => {
    if (!unblockingUser) return;
    setIsUnblocking(true);
    try {
      const response = await fetch(`${apiUrl}/api/users/all/unblock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ uid: unblockingUser.id }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to unblock user");

      // เปลี่ยนสถานะ is_blocked ในตารางให้เป็น false
      setUsers((prev) =>
        prev.map((u) =>
          u.id === unblockingUser.id ? { ...u, is_blocked: false } : u,
        ),
      );
      setIsUnblockModalOpen(false);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/settingsData")}
          className="flex items-center text-2xl text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-3"
        >
          <svg
            className="w-6 h-6 mt-1 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          จัดการผู้ใช้งาน 👥
        </button>
      </div>

      {/* Role Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: "all", label: "ทั้งหมด" },
            { key: "admin", label: "Admin" },
            { key: "user", label: "User" },
            { key: "rider", label: "Rider" },
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
              {role.label} (
              {roleCounts[role.key as keyof typeof roleCounts] || 0})
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
      </div>

      {/* Users Table / Loading / Error */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">
              กำลังโหลดข้อมูลผู้ใช้งาน...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-500 font-medium mb-2">❌ {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 bg-blue-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    เข้าระบบโดย
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    สร้างเมื่อ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    ใช้งานล่าสุด
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full mr-3 border border-gray-200 dark:border-gray-600 object-cover cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-emerald-500 transition-all"
                          onClick={() => {
                            setSelectedImage(user.avatar);
                            setIsImageModalOpen(true);
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src =
                              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                          }}
                        />
                        <div className="flex flex-col items-start">
                          <div className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                            {user.name}
                            {user.is_blocked && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-md">
                                ถูกบล็อค
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-1">
                        {getProviderIcon(user.provider)}
                      </span>
                      {user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {user.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        {/* ปุ่มแก้ไข */}
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewRole(user.role);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          แก้ไข
                        </button>

                        {/* ปุ่มบล็อค */}
                        {!user.is_blocked ? (
                          <button
                            onClick={() => {
                              setBlockingUser(user);
                              setIsBlockModalOpen(true);
                            }}
                            className="px-3 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-lg transition-colors"
                          >
                            บล็อค
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setUnblockingUser(user);
                              setIsUnblockModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg transition-colors shadow-sm"
                          >
                            ปลดบล็อค
                          </button>
                        )}

                        {/* ปุ่มลบ */}
                        <button
                          onClick={() => {
                            setDeletingUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              ไม่พบข้อมูลผู้ใช้งาน
            </p>
          </div>
        )}
      </div>

      {/* ============================================== */}
      {/* 🌟 1. Modal สำหรับแก้ไขบทบาทผู้ใช้ */}
      {/* ============================================== */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              แก้ไขบทบาทผู้ใช้งาน
            </h3>
            <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <img
                src={editingUser.avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  กำลังแก้ไข:
                </p>
                <p className="font-bold text-sm text-gray-800 dark:text-white truncate">
                  {editingUser.name}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เลือกบทบาทใหม่
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                <option value="rider">Rider (พนักงานจัดส่ง)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isSaving || newRole === editingUser.role}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 2. Modal ยืนยันการลบผู้ใช้งาน */}
      {/* ============================================== */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              ยืนยันการลบผู้ใช้งาน?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                "{deletingUser.name}"
              </span>{" "}
              ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "ยืนยันการลบ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBlockModalOpen && blockingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ยืนยันการบล็อค?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">คุณกำลังจะระงับการเข้าถึงของ <span className="font-bold text-gray-700 dark:text-gray-300">"{blockingUser.name}"</span> ผู้ใช้นี้จะไม่สามารถใช้งานระบบได้อีก</p>
            <div className="flex gap-3">
              <button onClick={() => setIsBlockModalOpen(false)} disabled={isBlocking} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl disabled:opacity-50">ยกเลิก</button>
              <button onClick={handleConfirmBlock} disabled={isBlocking} className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex justify-center items-center gap-2 disabled:opacity-50">
                {isBlocking ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "ยืนยันบล็อค"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isUnblockModalOpen && unblockingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              ยืนยันการปลดบล็อค?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              คุณกำลังจะคืนสิทธิ์การเข้าถึงให้{" "}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                "{unblockingUser.name}"
              </span>{" "}
              ผู้ใช้นี้จะสามารถกลับมาใช้งานระบบได้ตามปกติ
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsUnblockModalOpen(false)}
                disabled={isUnblocking}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl disabled:opacity-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmUnblock}
                disabled={isUnblocking}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isUnblocking ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "ยืนยันการปลดบล็อค"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ดูรูปภาพ */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Enlarged profile"
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain bg-gray-100 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src =
                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

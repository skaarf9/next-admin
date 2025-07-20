"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { jwtDecode } from "jwt-decode"; // 添加 JWT 解码库
import { getCookie } from "cookies-next"; // 添加 cookie 操作库

// 定义 JWT payload 类型
interface JwtPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
  pdfPermissions: { pdfId: number; canEdit: boolean }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  // 从 cookie 获取 token 并解码权限
  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token as string);
        setUserPermissions(decoded.permissions || []);
        setUserRoles(decoded.roles || []);
      } catch (error) {
        console.error('JWT 解码失败:', error);
      }
    }
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItem(prev => prev === title ? null : title);
  };

  // 检查用户是否有权限访问菜单项
  const hasPermission = (menuPath: string): boolean => {
    // 定义菜单路径到权限的映射
    // const pathToPermissionMap: Record<string, string> = {
    //   "/": "dashboard:view",
    //   "/admin/roles": "admin:roles",
    //   "/admin/users": "admin:users",
    //   "/pdf": "pdf:view",
    //   "/calendar": "calendar:view",
    //   "/profile": "profile:view",
    //   "/forms/form-elements": "forms:elements",
    //   "/forms/form-layout": "forms:layout",
    //   "/tables": "tables:view",
    //   "/pages/settings": "settings:view",
    //   "/charts/basic-chart": "charts:view",
    //   "/ui-elements/alerts": "ui:alerts",
    //   "/ui-elements/buttons": "ui:buttons",
    //   "/auth/sign-in": "auth:signin"
    // };

    // // 获取菜单项对应的权限
    // const requiredPermission = pathToPermissionMap[menuPath];
    
    // // 如果没有设置权限要求，则默认允许访问
    // if (!requiredPermission) return true;
    
    // 检查用户是否有所需权限
    return userPermissions.includes(menuPath) || userRoles.includes('admin');
  };

  // 过滤菜单项 - 只显示用户有权限访问的
  const filteredNavData = NAV_DATA.map(section => ({
    ...section,
    items: section.items
      .filter(item => {
        // 如果有子项，检查子项权限
        if (item.items && item.items.length > 0) {
          const hasVisibleChildren = item.items.some(subItem => 
            hasPermission(subItem.url)
          );
          return hasVisibleChildren;
        }
        
        // 没有子项，检查自身权限
        return hasPermission(item.url || "");
      })
      .map(item => ({
        ...item,
        // 过滤子项
        items: item.items?.filter(subItem => 
          hasPermission(subItem.url))
      }))
  }))
  .filter(section => section.items.length > 0); // 过滤掉空分组

  useEffect(() => {
    // 保持可折叠项打开，当子页面处于活动状态时
    // filteredNavData.some((section) => {
    //   return section.items.some((item) => {
    //     return item.items?.some((subItem) => {
    //       if (subItem.url === pathname) {
    //         if (!expandedItems.includes(item.title)) {
    //           toggleExpanded(item.title);
    //         }
    //         return true;
    //       }
    //       return false;
    //     });
    //   });
    // });
  }, [pathname/* , filteredNavData */]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {filteredNavData.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items && item.items.length > 0 ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span>{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItem === item.title &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItem === item.title && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-3"
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title}</span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
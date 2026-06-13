import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const NavLink = forwardRef(({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    const location = useLocation();

    // Custom check to see if the link is active based on path and specific query parameters
    const checkActive = () => {
        try {
            const currentPath = location.pathname;
            const currentSearch = new URLSearchParams(location.search);

            const toUrl = typeof to === 'string' ? to : (to.pathname + (to.search || '') + (to.hash || ''));
            const url = new URL(toUrl, 'http://dummy.com');
            const targetPath = url.pathname;
            const targetSearch = url.searchParams;

            // Pathname must match exactly
            if (currentPath !== targetPath) {
                return false;
            }

            // All query parameters defined in the target link must match the current URL
            for (const [key, val] of targetSearch.entries()) {
                if (currentSearch.get(key) !== val) {
                    return false;
                }
            }

            // Specific route-defining query keys (like 'tab') must not be present in the current URL 
            // if they are not explicitly defined in the target link.
            const targetKeys = Array.from(targetSearch.keys());
            const routeKeys = ['tab'];
            for (const key of routeKeys) {
                if (!targetKeys.includes(key) && currentSearch.has(key)) {
                    return false;
                }
            }

            return true;
        } catch (e) {
            return false;
        }
    };

    const isActive = checkActive();

    return (
        <RouterNavLink
            ref={ref}
            to={to}
            className={({ isPending }) => cn(className, isActive && activeClassName, isPending && pendingClassName)}
            {...props}
        />
    );
});

NavLink.displayName = "NavLink";

export { NavLink };

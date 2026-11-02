import { Component } from 'solid-js';
import { Navigate, useLocation } from '@solidjs/router';

const SupplierRedirect: Component = () => {
  const location = useLocation();
  const pathname = location.pathname.replace(/^\/contracts\//, '/suppliers/');
  return <Navigate href={`${pathname}${location.search}${location.hash}`} />;
};

export default SupplierRedirect;

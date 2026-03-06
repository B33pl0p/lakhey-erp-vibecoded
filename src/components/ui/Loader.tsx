import React from 'react';
import styles from './Loader.module.css';

export function Loader() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}></div>
    </div>
  );
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px' }) {
  return (
    <div 
      className={styles.skeleton} 
      style={{ width, height, borderRadius }} 
    />
  );
}

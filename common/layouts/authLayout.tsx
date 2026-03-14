import styles from '../../styles/authLayout.module.css';
import AppHead from '../components/app-head';

export default function AuthLayout({ children }: { children: any }) {
  return (
    <>
      <AppHead />
      <div className="flex min-h-screen w-full bg-blue-400 p-3 sm:p-4 md:p-6">
        <div className="m-auto w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[900px] lg:w-4/5 bg-slate-50 rounded-lg sm:rounded-xl shadow-lg grid lg:grid-cols-2 min-h-0 max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh] overflow-hidden">
          <div className={styles.imgStyle}>
            <div className={styles.cartoonImg}></div>
            <div className={styles.cloud1}></div>
            <div className={styles.cloud2}></div>
            <div className={styles.cloud3}></div>
          </div>
          <div className="right flex flex-col min-h-0 overflow-y-auto">
            <div className="flex flex-col justify-center flex-1 min-h-0 p-4 sm:p-6 lg:p-8 text-center w-full max-w-full box-border">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

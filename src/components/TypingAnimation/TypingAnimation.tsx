import styles from './TypingAnimation.module.css'

export const TypingAnimation = () => (
  <div className={styles.typingDots}>
    <span className={styles.dot}>.</span>
    <span className={styles.dot}>.</span>
    <span className={styles.dot}>.</span>
  </div>
)

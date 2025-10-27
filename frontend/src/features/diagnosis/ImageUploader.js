import React, { useState, useEffect } from 'react';
import styles from '../../styles/features/diagnosis/ImageUploader.module.css';

function ImageUploader({ onImageSelect, onAnalyze, isLoading, imageFile }) {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);
        
        // Clean up the object URL on unmount
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    return (
        <div className={styles.uploaderContainer}>
            <h2 className={styles.uploaderTitle}>1. 흉부 X-ray 이미지 업로드</h2>
            <div className={styles.uploaderPreviewArea}>
                {previewUrl ? (
                    <img src={previewUrl} alt="X-ray preview" className={styles.uploaderPreviewImage} />
                ) : (
                    <div className={styles.uploaderPlaceholder}>
                        <i className={`fas fa-upload ${styles.uploaderPlaceholderIcon}`}></i>
                        <p>파일을 드래그하거나 클릭하여 업로드</p>
                    </div>
                )}
                 <input type="file" className={styles.uploaderFileInput} accept="image/png, image/jpeg, image/dicom" onChange={handleFileChange} />
            </div>
            <button onClick={onAnalyze} disabled={!imageFile || isLoading} className={styles.uploaderButton}>
                 {isLoading ? (
                    <>
                        <i className={`fas fa-spinner fa-spin ${styles.uploaderButtonIcon}`}></i> 분석 중...
                    </>
                 ) : (
                    <>
                       <i className={`fas fa-microscope ${styles.uploaderButtonIcon}`}></i> 분석 시작
                    </>
                 )}
            </button>
        </div>
    );
}

export default ImageUploader;

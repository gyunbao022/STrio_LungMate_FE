import React, { useState, useEffect } from 'react';
import api from '../token/interceptors';
import styles from '../styles/pages/XRayUpload.module.css';


function XRayUpload({ currentUser }) {
    const [patientId, setPatientId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null

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
            setImageFile(e.target.files[0]);
            setUploadStatus(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!patientId || !doctorId || !imageFile) {
            alert('환자 ID, 담당의사 ID, 그리고 이미지 파일을 모두 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setUploadStatus(null);

    // FormData 객체 생성
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('doctorId', doctorId);
    formData.append('file', imageFile); // DTO의 MultipartFile 필드명과 일치하도록 변경
    formData.append('uploaderId', currentUser.memberId); // 'uploaderId'는 XrayImageDTO의 uploaderId 필드명과 일치해야 함

        try {
            const response = await api.post('/xray/upload', formData);
            if (response.status !== 200 || response.data !== "1") {
                throw new Error('업로드 실패');
            }
            
            console.log('Upload success:', response.data);

            setUploadStatus('success');
            // 성공 후 폼 초기화
            setPatientId('');
            setDoctorId('');
            setImageFile(null);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.headerTitle}>
                    X-Ray 이미지 업로드
                </h1>
                <p className={styles.headerSubtitle}>
                    환자의 X-Ray 이미지와 정보를 등록합니다.
                </p>
            </header>
            <main className={styles.main}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formContent}>
                        {/* 환자 및 의사 정보 입력 */}
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="patientId" className={styles.inputLabel}>환자 ID</label>
                                <input
                                    type="text"
                                    id="patientId"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    className={styles.input}
                                    placeholder="예: P12345"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="doctorId" className={styles.inputLabel}>담당 의사 ID</label>
                                <input
                                    type="text"
                                    id="doctorId"
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    className={styles.input}
                                    placeholder="예: D67890"
                                    required
                                />
                            </div>
                        </div>

                        {/* 이미지 업로드 */}
                        <div className={styles.uploadSection}>
                            <label className={styles.uploadLabel}>X-Ray 이미지</label>
                            <div className={styles.uploadArea}>
                                {previewUrl ? (
                                    <img src={previewUrl} alt="X-ray preview" className={styles.uploadPreview} />
                                ) : (
                                    <div className={styles.uploadPlaceholder}>
                                        <i className={`fas fa-upload ${styles.uploadIcon}`}></i>
                                        <p className={styles.uploadText}>파일을 드래그하거나 클릭하여 업로드</p>
                                    </div>
                                )}
                                <input type="file" className={styles.fileInput} accept="image/png, image/jpeg, image/dicom" onChange={handleFileChange} required />
                            </div>
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className={styles.submitSection}>
                        <button type="submit" disabled={isLoading} className={styles.submitButton}>
                            {isLoading ? (
                                <>
                                    <i className={`fas fa-spinner fa-spin ${styles.submitIcon}`}></i> 업로드 중...
                                </>
                            ) : (
                                <>
                                    <i className={`fas fa-cloud-upload-alt ${styles.submitIcon}`}></i> 정보 등록 및 업로드
                                </>
                            )}
                        </button>
                    </div>
                </form>
                {/* 업로드 상태 메시지 */}
                {uploadStatus && (
                    <div className={`${styles.statusMessage} ${uploadStatus === 'success' ? styles.statusSuccess : styles.statusError}`}>
                        {uploadStatus === 'success' ? '성공적으로 업로드되었습니다.' : '업로드 중 오류가 발생했습니다.'}
                    </div>
                )}
            </main>
        </div>
    );
}

export default XRayUpload;
import React, { useState, useEffect } from 'react';
import api from '../token/interceptors';
import styles from '../styles/pages/XRayUpload.module.css';
import DoctorPicker from '../components/DoctorPicker';


function XRayUpload({ currentUser, onNavigate }) {
    const [patientId, setPatientId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null

    // 권한 체크: ADMIN(A) 또는 XRAY_OPERATOR(X)만 업로드 가능
    const role = currentUser?.role;
    const hasPermission = role === 'A' || role === 'X' || role === 'ADMIN' || role === 'XRAY_OPERATOR';

    // 입력 패턴: 환자 ID는 숫자만 허용
    const PATIENT_ID_REGEX = /^\d+$/;
    // 의사ID는 DB의 실제 형식(예: doc01)에 맞춰 영숫자/언더스코어/하이픈 허용
    const DOCTOR_ID_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;

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

    // 이미지 압축 함수
    const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // 비율 유지하며 리사이즈
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Canvas를 Blob으로 변환 (JPEG, 품질 조정)
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                console.log(`원본 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                                resolve(compressedFile);
                            } else {
                                reject(new Error('이미지 압축 실패'));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadStatus(null);
            
            try {
                // 이미지 파일이면 압축
                if (file.type.startsWith('image/')) {
                    const compressed = await compressImage(file, 1920, 1920, 0.85);
                    setImageFile(compressed);
                } else {
                    setImageFile(file);
                }
            } catch (error) {
                console.error('이미지 처리 오류:', error);
                setImageFile(file); // 압축 실패 시 원본 사용
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 중복 제출 방지 (Enter 연타, 더블클릭 등)
        if (isLoading) return;
        if (!patientId || !doctorId || !imageFile) {
            alert('환자 ID, 담당의사 ID, 그리고 이미지 파일을 모두 입력해주세요.');
            return;
        }

        // 클라이언트 유효성 검증
        if (!PATIENT_ID_REGEX.test(patientId)) {
            alert('환자 ID는 숫자만 입력 가능합니다. 예: 12345');
            return;
        }
        if (!DOCTOR_ID_REGEX.test(doctorId)) {
            alert('담당 의사 ID 형식이 올바르지 않습니다. 예: D67890');
            return;
        }
        if (!(imageFile instanceof File)) {
            alert('업로드 파일을 다시 선택해주세요.');
            return;
        }
        setIsLoading(true);
        setUploadStatus(null);

    // FormData 객체 생성
    const formData = new FormData();
    formData.append('patientId', patientId);  // 문자열 그대로 전송 (백엔드 DTO가 String 타입)
    formData.append('doctorId', doctorId);
    formData.append('file', imageFile); // DTO의 MultipartFile 필드명과 일치하도록 변경
    // formData.append('uploaderId', currentUser.memberId); // 이 줄 삭제 또는 주석 처리

        try {
            const response = await api.post('/xray/upload', formData);
            console.log('Upload response:', response.status, response.data);

            const okStatus = response.status >= 200 && response.status < 300;
            const okBody =
                response.data === 1 ||
                response.data === "1" ||
                response.data === true ||
                (response.data && typeof response.data === 'object');

            if (!okStatus || !okBody) {
                throw new Error(`업로드 실패 (status=${response.status}, data=${JSON.stringify(response.data)})`);
            }

            setUploadStatus('success');
            // 성공 후 폼 초기화
            setPatientId('');
            setDoctorId('');
            setImageFile(null);
            
            // 2초 후 업로드 내역 페이지로 이동
            setTimeout(() => {
                if (onNavigate) {
                    onNavigate('upload-history');
                }
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // 세션/권한 가드
    if (!currentUser) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.headerTitle}>X-Ray 이미지 업로드</h1>
                    <p className={styles.headerSubtitle}>로그인이 필요합니다. 상단 메뉴에서 로그인해 주세요.</p>
                </header>
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.headerTitle}>X-Ray 이미지 업로드</h1>
                    <p className={styles.headerSubtitle}>이 기능은 관리자 또는 X-Ray 담당자만 사용할 수 있습니다.</p>
                </header>
            </div>
        );
    }

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
                                    onChange={(e) => {
                                        // 숫자 외 문자 제거하여 즉시 반영
                                        const onlyDigits = e.target.value.replace(/\D/g, '');
                                        setPatientId(onlyDigits);
                                    }}
                                    className={styles.input}
                                    placeholder="예: 12345"
                                    pattern="^[0-9]+$"
                                    title="숫자만 입력 (예: 12345)"
                                    inputMode="numeric"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="doctorId" className={styles.inputLabel}>담당 의사 ID</label>
                                <DoctorPicker
                                    value={doctorId}
                                    onChange={(id) => setDoctorId(id)}
                                    placeholder="의사 ID를 선택하세요"
                                    // 권한 문제로 /members/doctors가 403이면, 공개된 /member/list로 폴백
                                    endpoint="/members/doctors"
                                />
                                {/* 입력 직접 허용도 유지하려면 아래 인풋 주석 해제
                                <input
                                    type="text"
                                    id="doctorId"
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    className={styles.input}
                                    placeholder="예: doc01"
                                />
                                */}
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
                        {uploadStatus === 'success' 
                            ? '성공적으로 업로드되었습니다. 잠시 후 업로드 내역 페이지로 이동합니다...' 
                            : '업로드 중 오류가 발생했습니다.'}
                    </div>
                )}
            </main>
        </div>
    );
}

export default XRayUpload;
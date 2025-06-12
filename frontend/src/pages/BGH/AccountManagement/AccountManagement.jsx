// src/pages/BGH/AccountManagement/AccountManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout } from '../../../contexts/LayoutContext';
import { Container, Row, Col, Button, Alert, Form, Card } from 'react-bootstrap';
import { FaPlus, FaSearch } from 'react-icons/fa';
import api from '../../../api';

// Import các component con
import AccountTable from './components/AccountTable';
import AccountModal from './components/AccountModal';

const AccountManagement = () => {
    // === STATE ===
    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Lỗi chung của trang (ví dụ: không tải được dữ liệu)
    const [success, setSuccess] = useState(''); // Thông báo thành công của trang
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create'); // 'create' hoặc 'edit'
    const [selectedAccount, setSelectedAccount] = useState(null);
    
    const { setPageTitle } = useLayout();

    // === EFFECTS ===
    useEffect(() => {
        setPageTitle("Quản lý tài khoản");
    }, [setPageTitle]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [accountsRes, rolesRes] = await Promise.all([
                api.get('/api/accounts/management/'),
                api.get('/api/accounts/roles/')
            ]);
            setAccounts(accountsRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            
            // Xử lý lỗi chi tiết
            if (!err.response) {
                // Lỗi network - không thể kết nối đến server
                if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                    setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.");
                } else {
                    setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
                }
            } else if (err.response.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            } else if (err.response.status === 403) {
                setError("Bạn không có quyền truy cập chức năng này.");
            } else if (err.response.status === 404) {
                setError("Không tìm thấy dữ liệu. API có thể đã thay đổi.");
            } else if (err.response.status >= 500) {
                setError("Server đang gặp sự cố. Vui lòng thử lại sau.");
            } else {
                setError("Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // === HANDLERS ===
    const handleShowModal = (type, account = null) => {
        setModalType(type);
        setSelectedAccount(account);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAccount(null);
    };
    
    // Hàm này sẽ được truyền xuống Modal. Modal sẽ gọi nó khi người dùng submit form.
    const handleSubmitInModal = async (formData, accountId) => {
        try {
            if (modalType === 'create') {
                const createData = {
                    user: { username: formData.username, password: formData.password },
                    ...formData
                };
                delete createData.username;
                delete createData.password;
                await api.post('/api/accounts/management/create/', createData);
                setSuccess('Tạo tài khoản thành công!');
            } else {
                const { username, password, ...updateData } = formData;
                if (password && password.trim() !== '') {
                    updateData.user = { password };
                }
                await api.patch(`/api/accounts/management/${accountId}/update/`, updateData);
                setSuccess('Cập nhật tài khoản thành công!');
            }
            handleCloseModal();
            fetchData();
            return { success: true };
        } catch (err) {
            console.error("Lỗi khi submit form:", err);
            
            let userFriendlyError = "";
            
            // Xử lý lỗi chi tiết cho việc submit form
            if (!err.response) {
                // Lỗi network
                if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                    userFriendlyError = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
                } else {
                    userFriendlyError = "Không thể kết nối đến server. Vui lòng thử lại sau.";
                }
            } else if (err.response.status === 400) {
                // Lỗi validation
                if (err.response.data) {
                    const errorData = err.response.data;
                    if (errorData.username) {
                        userFriendlyError = "Tên đăng nhập đã tồn tại hoặc không hợp lệ.";
                    } else if (errorData.Email) {
                        userFriendlyError = "Email đã được sử dụng hoặc không hợp lệ.";
                    } else if (errorData.SoDienThoai) {
                        userFriendlyError = "Số điện thoại đã được sử dụng hoặc không hợp lệ.";
                    } else if (errorData.password || errorData.user?.password) {
                        userFriendlyError = "Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.";
                    } else if (errorData.error) {
                        userFriendlyError = errorData.error;
                    } else {
                        userFriendlyError = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.";
                    }
                } else {
                    userFriendlyError = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.";
                }
            } else if (err.response.status === 401) {
                userFriendlyError = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
            } else if (err.response.status === 403) {
                userFriendlyError = "Bạn không có quyền thực hiện thao tác này.";
            } else if (err.response.status === 409) {
                userFriendlyError = "Thông tin đã tồn tại trong hệ thống (email hoặc số điện thoại trùng lặp).";
            } else if (err.response.status >= 500) {
                userFriendlyError = "Server đang gặp sự cố. Vui lòng thử lại sau.";
            } else {
                userFriendlyError = "Thao tác không thành công. Vui lòng kiểm tra lại thông tin đã nhập.";
            }
            
            return { success: false, error: userFriendlyError };
        }
    };

    const handleDelete = async (account) => {
        if (window.confirm(`Bạn có chắc muốn xóa tài khoản "${account.Ho} ${account.Ten}"?`)) {
            try {
                await api.delete(`/api/accounts/management/${account.id}/delete/`);
                setSuccess('Xóa tài khoản thành công.');
                setAccounts(prev => prev.filter(acc => acc.id !== account.id));
            } catch (err) {
                console.error("Lỗi khi xóa tài khoản:", err);
                
                // Xử lý lỗi chi tiết cho việc xóa
                if (!err.response) {
                    // Lỗi network
                    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
                    } else {
                        setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
                    }
                } else if (err.response.status === 400) {
                    setError("Không thể xóa tài khoản này. Tài khoản có thể đang được sử dụng trong hệ thống.");
                } else if (err.response.status === 401) {
                    setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                } else if (err.response.status === 403) {
                    setError("Bạn không có quyền xóa tài khoản này.");
                } else if (err.response.status === 404) {
                    setError("Tài khoản không tồn tại hoặc đã được xóa.");
                } else if (err.response.status >= 500) {
                    setError("Server đang gặp sự cố. Vui lòng thử lại sau.");
                } else {
                    setError("Xóa tài khoản không thành công. Vui lòng thử lại.");
                }
            }
        }
    };

    // Logic tìm kiếm đã được sửa lại
    const filteredAccounts = accounts.filter(account => {
        const term = searchTerm.toLowerCase();
        const fullName = `${account.Ho} ${account.Ten}`.toLowerCase();
        const email = account.Email ? account.Email.toLowerCase() : '';
        const phoneNumber = account.SoDienThoai || '';
        return fullName.includes(term) || email.includes(term) || phoneNumber.includes(term);
    });

    // === RENDER ===
    return (
        <Container fluid className="py-4">
            <Row className="justify-content-between align-items-center mb-4">
                <Col xs="auto">
                    <h2 className="h4 mb-0 text-dark">Danh sách tài khoản</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => handleShowModal('create')}>
                        <FaPlus className="me-2" /> Tạo tài khoản mới
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            
            <Card className="shadow-sm">
                <Card.Header className="p-3 bg-white border-bottom">
                    <div style={{ maxWidth: '400px' }}>
                        <Form.Group className="position-relative">
                            <Form.Control 
                                type="text" 
                                placeholder="Tìm kiếm theo tên, email, SĐT..." 
                                className="ps-5" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        </Form.Group>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <AccountTable 
                        accounts={filteredAccounts}
                        loading={loading}
                        searchTerm={searchTerm}
                        roles={roles}
                        onEdit={(acc) => handleShowModal('edit', acc)}
                        onDelete={handleDelete}
                    />
                </Card.Body>
            </Card>
            
            {showModal && (
                <AccountModal 
                    show={showModal}
                    onHide={handleCloseModal}
                    modalType={modalType}
                    accountData={selectedAccount}
                    roles={roles}
                    onSubmit={handleSubmitInModal}
                />
            )}
        </Container>
    );
};

export default AccountManagement;
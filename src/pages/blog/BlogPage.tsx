import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Modal, Form, Spinner, Alert, Pagination, Nav, OverlayTrigger, Tooltip, ButtonGroup, Tabs, Tab, Dropdown, Badge, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCalendarAlt, faUser, faTags, faHeart, faThumbTack,
  faHeading, faParagraph, faCode, faListUl, faListOl, faQuoteLeft, faLink, faImage, 
  faTable, faBold, faItalic, faUnderline, faStrikethrough, faDivide, faGripLines,
  faEye, faArchive, faCloudUploadAlt, faEllipsisV, faCheckCircle, faClock, faIdBadge,
  faArrowLeft, faSearch
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './BlogPage.css'; // Yeni CSS dosyası için import

interface BlogPost {
  id: number;
  title: string;
  metaDescription?: string;
  content?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  slug?: string;
  publishedAt?: string | null;
  createdAt: string;
  author?: string;
  likeCount?: number;
  status: 'draft' | 'published' | 'archived' | string; // string olabilir ama nul/undefined olamaz
  updatedAt?: string;
}

interface BlogResponse {
  success: boolean;
  data: BlogPost[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Düğmeler için yeni arayüzler
interface EditorButton {
  label: string;
  icon: any; // FontAwesome icon
  action: () => void;
  text?: string;
}

interface ButtonGroup {
  title: string;
  buttons: EditorButton[];
}

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]); // Filtrelenmiş bloglar için yeni state
  const [searchTerm, setSearchTerm] = useState<string>(''); // Arama terimi için state
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Durum filtresi için state
  const [categoryFilter, setCategoryFilter] = useState<string>(''); // Kategori filtresi için state
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // Mevcut kategoriler için state
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    metaDescription: '',
    content: '',
    category: '',
    tags: '',
    coverImage: '',
    slug: '',
    status: 'draft'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [contentView, setContentView] = useState<'edit' | 'preview'>('edit');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showPublishPrompt, setShowPublishPrompt] = useState<boolean>(false);
  const [newlyCreatedBlogId, setNewlyCreatedBlogId] = useState<number | null>(null);

  // Renk paleti
  const colors = {
    primary: '#0a6c3c',
    secondary: '#174',
    light: '#e8f5e9',
    dark: 'hsl(150,83%,23%)',
    warning: '#ffc107',
    danger: '#dc3545',
    success: '#198754',
    info: '#0dcaf0'
  };

  // Bloglardan mevcut kategorileri çıkaran fonksiyon
  const extractAvailableCategories = (blogPosts: BlogPost[]) => {
    // Kategorileri topla ve benzersiz yap
    const categories = new Set<string>();
    
    blogPosts.forEach(post => {
      if (post.category && post.category.trim()) {
        categories.add(post.category.trim());
      }
    });
    
    // Set'i diziye çevir ve sırala
    return Array.from(categories).sort();
  };

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  // Bloglar yüklendiğinde mevcut kategorileri çıkar
  useEffect(() => {
    if (posts.length > 0) {
      setAvailableCategories(extractAvailableCategories(posts));
    }
  }, [posts]);

  // Arama ve filtre değişikliklerinde filtrelenmiş blogları güncelle
  useEffect(() => {
    if (!posts.length) {
      setFilteredPosts([]);
      return;
    }

    let result = [...posts];

    // Durum filtresini uygula
    if (statusFilter !== 'all') {
      result = result.filter(post => post.status === statusFilter);
    }

    // Kategori filtresini uygula
    if (categoryFilter) {
      result = result.filter(post => post.category === categoryFilter);
    }

    // Arama terimini uygula (başlık ve meta açıklamasında arama yap)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        post => 
          post.title.toLowerCase().includes(term) || 
          (post.metaDescription && post.metaDescription.toLowerCase().includes(term))
      );
    }

    setFilteredPosts(result);
  }, [posts, searchTerm, statusFilter, categoryFilter]);

  const fetchBlogPosts = async (page: number, pageSize: number = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get<BlogResponse>(
        `${API_BASE_URL}/Blog/admin?page=${page}&pageSize=${pageSize}&status=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Gelen verinin durumlarını kontrol etmek için loglama yapalım
        response.data.data.forEach(post => {
          console.log(`Blog ID: ${post.id}, Status: ${post.status}`);
        });
        
        setPosts(response.data.data);
        setFilteredPosts(response.data.data); // Başlangıçta tüm postları göster
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } else {
        setError('Blog yazıları yüklenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Blog yazıları alınamadı:', err);
      setError('Blog yazıları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenModal = async (post?: BlogPost) => {
    try {
      setIsSubmitting(true);

      if (post) {
        // Post varsa, önce mevcut güncel verileri API'den al
        const token = localStorage.getItem('token');
        
        setEditingPost(post); // Geçici olarak mevcut verileri kullan
        
        // API'den güncel verileri getir
        const response = await axios.get<{success: boolean, data: BlogPost}>(
          `${API_BASE_URL}/Blog/admin/${post.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          const freshData = response.data.data;
          
          // Güncel verileri kullanarak state'i güncelle
          setEditingPost(freshData);
          setTags(freshData.tags || []);
          setFormData({
            title: freshData.title,
            metaDescription: freshData.metaDescription || '',
            content: freshData.content || '',
            category: freshData.category || 'Genel',
            tags: '',
            coverImage: freshData.coverImage || '',
            slug: freshData.slug || '',
            status: freshData.status || 'draft'
          });
          
          console.log('Blog durumu:', freshData.status); // Durum bilgisini logla
        } else {
          setError('Blog detayları alınamadı.');
        }
      } else {
        // Yeni blog yazısı oluşturma
        setEditingPost(null);
        setTags([]);
        setFormData({
          title: '',
          metaDescription: '',
          content: '',
          category: 'Genel',
          tags: '',
          coverImage: '',
          slug: '',
          status: 'draft'
        });
      }
      
      setShowModal(true);
    } catch (err) {
      console.error('Blog yazısı verileri alınırken hata oluştu:', err);
      setError('Blog yazısı verileri alınamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'title' && !editingPost) {
      // Başlıktan otomatik slug üret (yeni ekleme yaparken)
      const slugValue = convertToSlug(value);
      setFormData({
        ...formData,
        [name]: value,
        slug: slugValue
      });
    } else if (name === 'slug') {
      // Slug özel karakterleri temizle
      setFormData({
        ...formData,
        [name]: convertToSlug(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Etiket işlemleri için yeni fonksiyonlar
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTag(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Slug dönüştürme fonksiyonu
  const convertToSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Content editor functions
  const insertHtmlTag = (openTag: string, closeTag: string, defaultText: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const textToInsert = selectedText || defaultText;
    
    const newText = 
      formData.content.substring(0, start) + 
      openTag + textToInsert + closeTag + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newText });
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textarea) {
        const newPosition = start + openTag.length + textToInsert.length + closeTag.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const getContentPreview = () => {
    return { __html: formData.content };
  };

  // Toggle preview mode independently
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Update the renderEditorToolbar function to be more compact
  const renderEditorToolbar = () => {
    // Daha az grupla ve yan yana daha fazla buton göster
    const buttonGroups: ButtonGroup[] = [
      {
        title: 'Başlıklar',
        buttons: [
          { label: 'H1', icon: faHeading, action: () => insertHtmlTag('<h1>', '</h1>', 'Başlık 1'), text: 'H1' },
          { label: 'H2', icon: faHeading, action: () => insertHtmlTag('<h2>', '</h2>', 'Başlık 2'), text: 'H2' },
          { label: 'H3', icon: faHeading, action: () => insertHtmlTag('<h3>', '</h3>', 'Başlık 3'), text: 'H3' },
          { label: 'H4', icon: faHeading, action: () => insertHtmlTag('<h4>', '</h4>', 'Başlık 4'), text: 'H4' },
        ]
      },
      {
        title: 'Metin',
        buttons: [
          { label: 'Kalın', icon: faBold, action: () => insertHtmlTag('<strong>', '</strong>', 'kalın metin') },
          { label: 'İtalik', icon: faItalic, action: () => insertHtmlTag('<em>', '</em>', 'italik metin') },
          { label: 'Altı Çizili', icon: faUnderline, action: () => insertHtmlTag('<u>', '</u>', 'altı çizili metin') },
          { label: 'Üstü Çizili', icon: faStrikethrough, action: () => insertHtmlTag(' ', ' ', 'üstü çizili metin') },
          { label: 'Paragraf', icon: faParagraph, action: () => insertHtmlTag('<p>', '</p>', 'Paragraf metni') },
        ]
      },
      {
        title: 'Listeler',
        buttons: [
          { label: 'Sırasız Liste', icon: faListUl, action: () => insertHtmlTag('<ul>\n  <li>', '</li>\n</ul>', 'Liste öğesi') },
          { label: 'Sıralı Liste', icon: faListOl, action: () => insertHtmlTag('<ol>\n  <li>', '</li>\n</ol>', 'Liste öğesi') },
          { label: 'Alıntı', icon: faQuoteLeft, action: () => insertHtmlTag('<blockquote>', '</blockquote>', 'Alıntı metni') },
        ]
      },
      {
        title: 'Medya',
        buttons: [
          { label: 'Bağlantı', icon: faLink, action: () => insertHtmlTag('<a href="https://ornek.com">', '</a>', 'bağlantı metni') },
          { label: 'Resim', icon: faImage, action: () => insertHtmlTag('<img src="https://ornek.com/resim.jpg" alt="', '">', 'Resim açıklaması') },
          { label: 'Tablo', icon: faTable, action: () => insertHtmlTag('<table border="1">\n  <thead>\n    <tr>\n      <th>Başlık 1</th>\n      <th>Başlık 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Hücre 1</td>\n      <td>Hücre 2</td>\n    </tr>\n  </tbody>\n</table>', '', '') },
          { label: 'Kod', icon: faCode, action: () => insertHtmlTag('<code>', '</code>', 'kod') },
        ]
      }
    ];

    return (
      <div className="editor-toolbar border rounded mb-2 p-2 bg-light">
        <div className="d-flex flex-wrap align-items-center">
          {buttonGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="me-3 mb-1">
              <span className="text-muted small me-1">{group.title}:</span>
              <ButtonGroup size="sm" className="me-1">
                {group.buttons.map((button, buttonIndex) => (
                  <OverlayTrigger
                    key={buttonIndex}
                    placement="top"
                    overlay={<Tooltip>{button.label}</Tooltip>}
                  >
                    <Button 
                      variant="outline-secondary" 
                      className="py-0 px-1"
                      onClick={button.action}
                    >
                      {button.icon ? 
                        <FontAwesomeIcon icon={button.icon} /> : 
                        (button.text || '')}
                    </Button>
                  </OverlayTrigger>
                ))}
              </ButtonGroup>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    // Form doğrulama
    if (!formData.title.trim()) {
      setError('Başlık alanı zorunludur.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const postData = {
        title: formData.title,
        metaDescription: formData.metaDescription,
        content: formData.content,
        category: formData.category,
        tags: tags,
        coverImage: formData.coverImage,
        slug: formData.slug,
        status: editingPost ? formData.status : 'draft'
      };

      if (editingPost) {
        // Blog yazısını güncelle
        await axios.put(
          `${API_BASE_URL}/Blog/${editingPost.id}`,
          postData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // Yeni blog yazısı ekle
        const response = await axios.post(
          `${API_BASE_URL}/Blog`,
          postData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Yeni oluşturulan blogun ID'sini al
        if (response.data && response.data.data && response.data.data.id) {
          setNewlyCreatedBlogId(response.data.data.id);
          // Oluşturma sonrası yayınlama promtu göster
          setShowPublishPrompt(true);
        }
      }
      
      // İşlem başarılı olduktan sonra sayfayı 1'e resetleyip verileri yeniden yükle
      setCurrentPage(1);
      // Kısa bir bekleme süresi ekleyerek API'nin güncel verileri döndürmesini sağla
      setTimeout(() => {
        fetchBlogPosts(1);
      }, 300);
      
      setShowModal(false);
    } catch (err) {
      console.error('Blog yazısı kaydedilirken hata oluştu:', err);
      setError('Blog yazısı kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Blog yayınlama teklif modalını kapat
  const handleClosePublishPrompt = () => {
    setShowPublishPrompt(false);
    setNewlyCreatedBlogId(null);
  };

  // Publish işlevi hem yayınlamak hem de tarihi güncellemek için kullanılır
  const publishBlogPost = async (id: number) => {
    try {
      const token = localStorage.getItem('token');

      // Seçilen blog postunun durumunu kontrol et
      const selectedBlog = posts.find(post => post.id === id);
      let updatePublishedDate = true;

      // Eğer post arşivde ise, kullanıcıya tarih güncellemek isteyip istemediğini sor
      if (selectedBlog && selectedBlog.status === 'archived') {
        updatePublishedDate = window.confirm('Arşivden yayına alırken yayınlanma tarihini güncellemek istiyor musunuz?');
      }
      
      await axios.post(
        `${API_BASE_URL}/Blog/${id}/publish`,
        { updatePublishedDate },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // İşlem başarılı olduktan sonra sayfayı 1'e resetleyip verileri yeniden yükle
      setCurrentPage(1);
      // Kısa bir bekleme süresi ekleyerek API'nin güncel verileri döndürmesini sağla
      setTimeout(() => {
        fetchBlogPosts(1);
      }, 300);
    } catch (err) {
      console.error('Blog yazısı yayınlanırken hata oluştu:', err);
      alert('Blog yazısı yayınlanırken bir hata oluştu.');
    }
  };

  const archiveBlogPost = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/Blog/${id}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // İşlem başarılı olduktan sonra sayfayı 1'e resetleyip verileri yeniden yükle
      setCurrentPage(1);
      // Kısa bir bekleme süresi ekleyerek API'nin güncel verileri döndürmesini sağla
      setTimeout(() => {
        fetchBlogPosts(1);
      }, 300);
    } catch (err) {
      console.error('Blog yazısı arşivlenirken hata oluştu:', err);
      alert('Blog yazısı arşivlenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API_BASE_URL}/Blog/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // İşlem başarılı olduktan sonra sayfayı 1'e resetleyip verileri yeniden yükle
        setCurrentPage(1);
        // Kısa bir bekleme süresi ekleyerek API'nin güncel verileri döndürmesini sağla
        setTimeout(() => {
          fetchBlogPosts(1);
        }, 300);
      } catch (err) {
        console.error('Blog yazısı silinirken hata oluştu:', err);
        alert('Blog yazısı silinirken bir hata oluştu.');
      }
    }
  };

  // Blog durum bilgisi badge'i
  const getStatusBadge = (post: BlogPost) => {
    // Status tanımlı değilse veya bozuk veri gelirse
    if (!post || !post.status) {
      console.warn('Post status missing or undefined:', post);
      return <Badge bg="warning" text="dark">Durum Belirsiz</Badge>;
    }

    // String olarak durumu karşılaştır, case-insensitive
    const status = post.status.toLowerCase();
    
    if (status === 'archived') {
      return <Badge bg="secondary">Arşivlenmiş</Badge>;
    } else if (status === 'published' || post.publishedAt) {
      return <Badge bg="success">Yayında</Badge>;
    } else if (status === 'draft') {
      return <Badge bg="warning" text="dark">Taslak</Badge>;
    } else {
      return <Badge bg="info">Diğer: {post.status}</Badge>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pageItems = [];
    
    // Önceki sayfa butonu
    pageItems.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );
    
    // Sayfa numaraları
    for (let number = 1; number <= totalPages; number++) {
      pageItems.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    // Sonraki sayfa butonu
    pageItems.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );
    
    return <Pagination className="justify-content-center mt-4">{pageItems}</Pagination>;
  };

  // Blog detaylarını görüntüleme
  const handleViewDetails = async (post: BlogPost) => {
    try {
      // İlk olarak durumu düzgün kontrol etmek için doğru duruma sahip post verisini ayarla
      setSelectedPost({
        ...post,
        status: post.status // Durumun doğru şekilde ayarlandığından emin ol
      });
      setShowDetailModal(true);
      
      // Tam blog detaylarını getir - doğru endpoint kullanılıyor
      const token = localStorage.getItem('token');
      
      const response = await axios.get<{success: boolean, data: BlogPost}>(
        `${API_BASE_URL}/Blog/admin/${post.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        const updatedPost = response.data.data;
        // API'den gelen durum bilgisinin korunduğundan emin ol
        setSelectedPost(updatedPost);
        console.log('Blog detay durumu:', updatedPost.status);
      }
    } catch (err) {
      console.error('Blog detayları alınırken hata oluştu:', err);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPost(null);
  };

  // Görünüm modları arasında geçiş
  const toggleViewMode = () => {
    setViewMode(viewMode === 'cards' ? 'table' : 'cards');
  };

  // Sadece tarih güncellemesi için kullanılacak fonksiyon
  const updatePublishDate = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/Blog/${id}/publish`,
        { updatePublishedDate: true },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // İşlem başarılı olduktan sonra sayfayı 1'e resetleyip verileri yeniden yükle
      setCurrentPage(1);
      // Kısa bir bekleme süresi ekleyerek API'nin güncel verileri döndürmesini sağla
      setTimeout(() => {
        fetchBlogPosts(1);
      }, 300);
    } catch (err) {
      console.error('Blog yazısı tarihi güncellenirken hata oluştu:', err);
      alert('Blog yazısı tarihi güncellenirken bir hata oluştu.');
    }
  };

  // Arama değişikliklerini işleyen fonksiyon
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Durum filtresi değişikliklerini işleyen fonksiyon
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Kategori filtresi değişikliklerini işleyen fonksiyon
  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
  };

  return (
    <div className="blog-management-page pb-4">
      <Container fluid className="px-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ color: colors.primary }}>Blog Yönetimi</h1>
            <p className="text-muted">Toplam {posts.length} blog yazısı, {currentPage}/{totalPages} sayfa</p>
          </div>
          <div className="d-flex gap-3">
            <Button 
              variant="outline-secondary" 
              onClick={toggleViewMode}
              className="me-2"
            >
              <FontAwesomeIcon icon={viewMode === 'cards' ? faListUl : faImage} className="me-2" />
              {viewMode === 'cards' ? 'Tablo Görünümü' : 'Kart Görünümü'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleOpenModal()}
              style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Yeni Blog Yazısı
            </Button>
          </div>
        </div>

        {/* Arama ve Filtre bölümü */}
        <div className="filters-section mb-4">
          <Row>
            <Col lg={5} md={6} sm={12} className="mb-3">
              <Form.Group>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <Form.Control 
                    type="text" 
                    placeholder="Blog yazılarında ara..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col lg={3} md={3} sm={6} className="mb-3">
              <Form.Group>
                <Form.Select 
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                  <option value="archived">Arşivlenmiş</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={4} md={3} sm={6} className="mb-3">
              <Form.Group>
                <Form.Select 
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                >
                  <option value="">Tüm Kategoriler</option>
                  {availableCategories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">{error}</Alert>
        )}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" style={{ color: colors.primary }} />
            <p className="mt-2">Blog yazıları yükleniyor...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          searchTerm || statusFilter !== 'all' || categoryFilter ? (
            <Alert variant="info">
              Arama kriterlerine uygun blog yazısı bulunamadı. 
              {searchTerm && <span> "{searchTerm}" için sonuç yok.</span>}
              {statusFilter !== 'all' && <span> "{statusFilter}" durumunda blog yok.</span>}
              {categoryFilter && <span> "{categoryFilter}" kategorisinde blog yok.</span>}
            </Alert>
          ) : (
            <Alert variant="info">Henüz blog yazısı bulunmuyor. Yeni bir yazı ekleyin!</Alert>
          )
        ) : (
          <>
            {/* Filtrelenmiş blog sayısını göster */}
            <p className="text-muted">
              {filteredPosts.length === posts.length 
                ? `Toplam ${posts.length} blog yazısı` 
                : `Filtrelenmiş sonuçlar: ${filteredPosts.length} / ${posts.length} blog yazısı`}
            </p>
            
            {/* Blog Yazıları */}
            {viewMode === 'cards' ? (
              <Row>
                {filteredPosts.map(post => (
                  <Col key={post.id} lg={4} md={6} className="mb-4">
                    <Card 
                      className="h-100 shadow-sm border-0 blog-card" 
                      onClick={() => handleViewDetails(post)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s', overflow: 'hidden' }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {post.coverImage && (
                        <div className="position-relative">
                          <Card.Img 
                            variant="top" 
                            src={post.coverImage} 
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="position-absolute top-0 end-0 m-2">
                            {getStatusBadge(post)}
                          </div>
                          <div className="position-absolute bottom-0 start-0 m-2 bg-dark text-white px-2 py-1 rounded-pill opacity-75">
                            <FontAwesomeIcon icon={faIdBadge} className="me-1" />
                            ID: {post.id}
                          </div>
                        </div>
                      )}
                      <Card.Body>
                        <Card.Title className="mb-3">{post.title}</Card.Title>
                        <div className="text-muted small mb-3">
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                            Oluşturulma: {formatDate(post.createdAt)}
                          </div>
                          {post.updatedAt && (
                            <div className="mb-2">
                              <FontAwesomeIcon icon={faClock} className="me-1" />
                              Güncelleme: {formatDate(post.updatedAt)}
                            </div>
                          )}
                        </div>
                        <Card.Text className="mb-3">
                          {post.metaDescription ? 
                            (post.metaDescription.length > 100 ? 
                              post.metaDescription.substring(0, 100) + '...' : 
                              post.metaDescription
                            ) : 'Açıklama bulunmuyor.'
                          }
                        </Card.Text>
                        {post.tags && post.tags.length > 0 && (
                          <div className="mb-3">
                            {post.tags.map((tag, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">{tag}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="d-flex justify-content-end mt-auto" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="light" 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(post); }}
                            title="Düzenle"
                            className="action-button me-1"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-primary" />
                          </Button>
                          
                          {/* Butonların duruma göre render edilmesi */}
                          {post.status === 'draft' ? (
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { e.stopPropagation(); publishBlogPost(post.id); }}
                                title="Yayınla"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                              </Button>
                              <Button 
                                variant="light" 
                                onClick={(e) => { e.stopPropagation(); archiveBlogPost(post.id); }}
                                title="Arşivle"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                              </Button>
                            </>
                          ) : post.status === 'published' ? (
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { updatePublishDate(post.id); }}
                                title="Tarih Güncelle"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-info" />
                              </Button>
                              <Button 
                                variant="light"
                                onClick={(e) => { archiveBlogPost(post.id); }}
                                title="Arşive Al"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                              </Button>
                            </>
                          ) : post.status === 'archived' ? (
                            <Button 
                              variant="light" 
                              onClick={(e) => { e.stopPropagation(); publishBlogPost(post.id); }}
                              title="Yayınla"
                              className="action-button me-1"
                            >
                              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                            </Button>
                          ) : (
                            // Tanımlanamayan durumlar için varsayılan butonlar
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { publishBlogPost(post.id); }}
                                title="Yayınla"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                              </Button>
                              <Button 
                                variant="light" 
                                onClick={(e) => { archiveBlogPost(post.id); }}
                                title="Arşivle"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="light" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                            title="Sil"
                            className="action-button"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-danger" />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover blog-table">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Durum</th>
                      <th>Başlık</th>
                      <th>Kategori</th>
                      <th>Etiketler</th>
                      <th>Oluşturulma</th>
                      <th>Güncellenme</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map(post => (
                      <tr key={post.id} onClick={() => handleViewDetails(post)} style={{ cursor: 'pointer' }}>
                        <td><Badge bg="dark">{post.id}</Badge></td>
                        <td>{getStatusBadge(post)}</td>
                        <td>{post.title}</td>
                        <td>{post.category || '-'}</td>
                        <td>
                          {post.tags && post.tags.length > 0 ? 
                            post.tags.map((tag, index) => (
                              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">{tag}</Badge>
                            )) : '-'
                          }
                        </td>
                        <td>{formatDate(post.createdAt)}</td>
                        <td>{post.updatedAt ? formatDate(post.updatedAt) : formatDate(post.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex">
                            <Button 
                              variant="light"
                              onClick={(e) => handleOpenModal(post)}
                              title="Düzenle"
                              className="action-button me-1"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-primary" />
                            </Button>
                            
                            {/* Butonların duruma göre render edilmesi */}
                            {post.status === 'draft' ? (
                              <>
                                <Button 
                                  variant="light"
                                  onClick={(e) => { publishBlogPost(post.id); }}
                                  title="Yayınla"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                                </Button>
                                <Button 
                                  variant="light"
                                  onClick={(e) => { archiveBlogPost(post.id); }}
                                  title="Arşivle"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                                </Button>
                              </>
                            ) : post.status === 'published' ? (
                              <>
                                <Button 
                                  variant="light" 
                                  onClick={(e) => { updatePublishDate(post.id); }}
                                  title="Tarih Güncelle"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-info" />
                                </Button>
                                <Button 
                                  variant="light"
                                  onClick={(e) => { archiveBlogPost(post.id); }}
                                  title="Arşive Al"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                                </Button>
                              </>
                            ) : post.status === 'archived' ? (
                              <Button 
                                variant="light" 
                                onClick={(e) => { publishBlogPost(post.id); }}
                                title="Yayınla"
                                className="action-button me-1"
                              >
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                              </Button>
                            ) : (
                              // Tanımlanamayan durumlar için varsayılan butonlar
                              <>
                                <Button 
                                  variant="light" 
                                  onClick={(e) => { publishBlogPost(post.id); }}
                                  title="Yayınla"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-success" />
                                </Button>
                                <Button 
                                  variant="light" 
                                  onClick={(e) => { archiveBlogPost(post.id); }}
                                  title="Arşivle"
                                  className="action-button me-1"
                                >
                                  <FontAwesomeIcon icon={faArchive} className="text-secondary" />
                                </Button>
                              </>
                            )}
                            
                            <Button 
                              variant="light"
                              onClick={(e) => { handleDelete(post.id); }}
                              title="Sil"
                              className="action-button"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sayfalama - sadece filtre yoksa göster */}
            {statusFilter === 'all' && !searchTerm && !categoryFilter && totalPages > 1 && renderPagination()}
          </>
        )}

        {/* Blog Detay Modalı */}
        <Modal 
          show={showDetailModal} 
          onHide={handleCloseDetailModal} 
          centered 
          size="lg"
          className="blog-detail-modal"
          fullscreen="lg-down"
        >
          <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
            <div className="d-flex align-items-center justify-content-between w-100">
              <Modal.Title>
                {selectedPost?.title}
              </Modal.Title>
              <div>
                <Badge bg="dark" className="me-2">
                  <FontAwesomeIcon icon={faIdBadge} className="me-1" />
                  ID: {selectedPost?.id}
                </Badge>
                {selectedPost && getStatusBadge(selectedPost)}
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-0">
            {selectedPost && (
              <div className="blog-detail-content">
                {/* Kapak Görseli Hero Alanı */}
                {selectedPost.coverImage && (
                  <div className="blog-hero-image" 
                    style={{ 
                      backgroundImage: `url(${selectedPost.coverImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '250px',
                      position: 'relative'
                    }}
                  >
                    <div className="blog-hero-overlay" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '1rem'
                      }}
                    >
                      <div className="text-white">
                        <div className="d-flex align-items-center mb-2">
                          {getStatusBadge(selectedPost)}
                          <div className="ms-2 post-info">
                            <FontAwesomeIcon icon={faUser} className="me-1" /> 
                            {selectedPost.author || 'Admin'}
                          </div>
                          {selectedPost.likeCount !== undefined && (
                            <div className="ms-3">
                              <FontAwesomeIcon icon={faHeart} className="me-1 text-danger" />
                              {selectedPost.likeCount} beğeni
                            </div>
                          )}
                        </div>
                        <h2 className="text-white mb-0">{selectedPost.title}</h2>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* İçerik Alanı */}
                <div className="p-4">
                  <div className="row">
                    {/* Sol Taraf - İçerik */}
                    <div className="col-lg-8">
                      {!selectedPost.coverImage && (
                        <h2 className="mb-3">{selectedPost.title}</h2>
                      )}
                      
                      {/* Blog Açıklama Alanı */}
                      {selectedPost.metaDescription && (
                        <div className="bg-light p-3 rounded mb-4 border-start border-primary border-3">
                          <p className="lead mb-0 fst-italic text-secondary">
                            {selectedPost.metaDescription}
                          </p>
                        </div>
                      )}
                      
                      {/* Blog İçerik Alanı */}
                      <div className="blog-content-wrapper mb-4">
                        <h5 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                          <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
                          Blog İçeriği
                        </h5>
                        
                        <div className="blog-content-container">
                          {selectedPost.content ? (
                            <div 
                              className="blog-content p-3 border rounded blog-paper-effect"
                              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                            />
                          ) : (
                            <div className="text-center p-5 border rounded">
                              <Spinner animation="border" className="mb-3" />
                              <p className="mb-0 text-muted">İçerik yükleniyor...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sağ Taraf - Meta Bilgiler */}
                    <div className="col-lg-4">
                      <div className="blog-meta-card bg-light rounded p-3 mb-3 shadow-sm sticky-top" style={{ top: '10px' }}>
                        <h5 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                          <FontAwesomeIcon icon={faIdBadge} className="me-2 text-primary" />
                          Blog Bilgileri
                        </h5>
                        
                        <div className="meta-item mb-3">
                          <div className="small text-muted mb-1">Kategori</div>
                          <div>
                            <Badge bg="secondary" style={{ fontSize: '0.9rem' }}>
                              {selectedPost.category || 'Genel'}
                            </Badge>
                          </div>
                        </div>
                        
                        {selectedPost.tags && selectedPost.tags.length > 0 && (
                          <div className="meta-item mb-3">
                            <div className="small text-muted mb-1">Etiketler</div>
                            <div>
                              {selectedPost.tags.map((tag, index) => (
                                <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="meta-item mb-3">
                          <div className="small text-muted mb-1">Oluşturulma Tarihi</div>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                            {formatDateTime(selectedPost.createdAt)}
                          </div>
                        </div>
                        
                        {selectedPost.updatedAt && (
                          <div className="meta-item mb-3">
                            <div className="small text-muted mb-1">Güncellenme Tarihi</div>
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                              {formatDateTime(selectedPost.updatedAt)}
                            </div>
                          </div>
                        )}
                        
                        {selectedPost.publishedAt && (
                          <div className="meta-item mb-3">
                            <div className="small text-muted mb-1">Yayınlanma Tarihi</div>
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faThumbTack} className="me-2 text-success" />
                              {formatDateTime(selectedPost.publishedAt)}
                            </div>
                          </div>
                        )}
                        
                        <div className="meta-item">
                          <div className="small text-muted mb-1">Site URL</div>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faLink} className="me-2 text-primary" />
                            <a 
                              href={`https://www.temizyuva.com/${selectedPost.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-truncate"
                            >
                              {selectedPost.slug}
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="blog-actions-card bg-light rounded p-3 shadow-sm">
                        <h5 className="border-bottom pb-2 mb-3 d-flex align-items-center">
                          <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" />
                          Hızlı İşlemler
                        </h5>
                        
                        <div className="d-grid gap-2">
                          <Button 
                            variant="light" 
                            onClick={(e) => { handleCloseDetailModal(); handleOpenModal(selectedPost); }}
                            className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                          >
                            <span>Düzenle</span>
                            <FontAwesomeIcon icon={faEdit} className="action-icon ms-2 text-primary" />
                          </Button>
                          
                          {selectedPost.status === 'draft' ? (
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { publishBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Yayınla</span>
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="action-icon ms-2 text-success" />
                              </Button>
                              <Button 
                                variant="light" 
                                onClick={(e) => { archiveBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Arşivle</span>
                                <FontAwesomeIcon icon={faArchive} className="action-icon ms-2 text-secondary" />
                              </Button>
                            </>
                          ) : selectedPost.status === 'published' ? (
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { updatePublishDate(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Tarih Güncelle</span>
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="action-icon ms-2 text-info" />
                              </Button>
                              <Button 
                                variant="light" 
                                onClick={(e) => { archiveBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Arşive Al</span>
                                <FontAwesomeIcon icon={faArchive} className="action-icon ms-2 text-secondary" />
                              </Button>
                            </>
                          ) : selectedPost.status === 'archived' ? (
                            <Button 
                              variant="light" 
                              onClick={(e) => { publishBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                              className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                            >
                              <span>Yayınla</span>
                              <FontAwesomeIcon icon={faCloudUploadAlt} className="action-icon ms-2 text-success" />
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="light" 
                                onClick={(e) => { publishBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Yayınla</span>
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="action-icon ms-2 text-success" />
                              </Button>
                              <Button 
                                variant="light" 
                                onClick={(e) => { archiveBlogPost(selectedPost.id); handleCloseDetailModal(); }}
                                className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                              >
                                <span>Arşivle</span>
                                <FontAwesomeIcon icon={faArchive} className="action-icon ms-2 text-secondary" />
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="light" 
                            onClick={(e) => { handleDelete(selectedPost.id); handleCloseDetailModal(); }}
                            className="action-button d-flex align-items-center justify-content-between px-3 py-2 fw-semibold"
                          >
                            <span>Sil</span>
                            <FontAwesomeIcon icon={faTrash} className="action-icon ms-2 text-danger" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.light, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleCloseDetailModal}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Listeye Dön
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Blog Yazısı Düzenleme Modalı */}
        <Modal 
          show={showModal} 
          onHide={handleCloseModal} 
          centered 
          size="xl" 
          dialogClassName="blog-edit-modal-wide"
          contentClassName="h-100"
        >
          <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
            <Modal.Title>
              {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı Ekle'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger">{error}</Alert>
            )}
            <Form>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Başlık</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Blog yazısı başlığı"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Form.Label className="mb-0">İçerik</Form.Label>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={togglePreview}
                        title="Blog yazısının önizlemesini göster/gizle"
                        className="py-0 px-1"
                      >
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        {showPreview ? 'Düzenle' : 'Önizle'}
                      </Button>
                    </div>
                    
                    {!showPreview ? (
                      <div className="editor-container">
                        {renderEditorToolbar()}
                        <Form.Control 
                          as="textarea" 
                          rows={15}
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          placeholder="Blog yazısı içeriği (HTML desteklenir)"
                          ref={contentTextareaRef}
                          className="font-monospace"
                        />
                      </div>
                    ) : (
                      <div className="preview-container border rounded p-3 mb-3" style={{ height: '400px', overflow: 'auto' }}>
                        <div 
                          className="blog-content"
                          dangerouslySetInnerHTML={getContentPreview()}
                        />
                      </div>
                    )}
                    
                    <Form.Text className="text-muted">
                      İçerik alanında HTML etiketleri kullanabilirsiniz. Düğmelere tıklayarak yaygın HTML etiketlerini ekleyebilirsiniz.
                    </Form.Text>
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meta Açıklama</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      placeholder="Blog yazısı meta açıklaması (SEO için)"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Kategori</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Kategori"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Etiketler</Form.Label>
                    <div className="d-flex flex-wrap align-items-center mb-2">
                      {tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="badge bg-light text-dark me-2 mb-2 p-2 d-flex align-items-center"
                          style={{ fontSize: '0.9rem' }}
                        >
                          {tag}
                          <span 
                            className="ms-2 text-danger" 
                            style={{ cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                          >
                            &times;
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="d-flex">
                      <Form.Control 
                        type="text" 
                        value={currentTag}
                        onChange={(e) => { e.stopPropagation(); handleTagInputChange(e as React.ChangeEvent<HTMLInputElement>); }}
                        onKeyDown={(e) => { e.stopPropagation(); handleTagInputKeyDown(e as React.KeyboardEvent<HTMLInputElement>); }}
                        placeholder="Yeni etiket yazın ve Enter'a basın"
                      />
                      <Button 
                        variant="outline-secondary" 
                        onClick={(e) => { e.stopPropagation(); addTag(); }} 
                        className="ms-2"
                      >
                        Ekle
                      </Button>
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Durum</Form.Label>
                    {editingPost ? (
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={(e) => { e.stopPropagation(); handleInputChange(e); }}
                      >
                        <option value="draft">Taslak</option>
                        <option value="published">Yayınlanmış</option>
                        <option value="archived">Arşivlenmiş</option>
                      </Form.Select>
                    ) : (
                      <Form.Text className="text-muted">
                        Blog yazısı taslak olarak oluşturulacak. Oluşturulduktan sonra yayınlama seçeneği sunulacak.
                      </Form.Text>
                    )}
                    <Form.Text className="text-muted">
                      Taslak: Henüz yayınlanmamış yazı
                      <br />
                      Yayınlanmış: Sitede görünür
                      <br />
                      Arşivlenmiş: Arşive kaldırılmış, sitede görünmez
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>SEO URL (Slug)</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="slug"
                      value={formData.slug}
                      onChange={(e) => { e.stopPropagation(); handleInputChange(e); }}
                      placeholder="örnek-blog-yazisi"
                    />
                    {formData.slug && (
                      <Alert variant="info" className="mt-2 py-2 small mb-0">
                        <strong>Önizleme:</strong> https://www.temizyuva.com/{formData.slug}
                      </Alert>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Kapak Görseli URL</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={(e) => { e.stopPropagation(); handleInputChange(e); }}
                      placeholder="Görsel URL"
                    />
                    {formData.coverImage && (
                      <div className="mt-3 border rounded p-2">
                        <div 
                          style={{ 
                            height: '120px', 
                            backgroundImage: `url(${formData.coverImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.light }}>
            <div className="d-flex gap-2">
              {editingPost && (
                <>
                  {editingPost.status === 'draft' ? (
                    <>
                      <Button 
                        variant="success" 
                        onClick={(e) => { e.stopPropagation(); publishBlogPost(editingPost.id); handleCloseModal(); }}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
                        Yayınla
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); archiveBlogPost(editingPost.id); handleCloseModal(); }}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faArchive} className="me-2" />
                        Arşivle
                      </Button>
                    </>
                  ) : editingPost.status === 'published' ? (
                    <>
                      <Button 
                        variant="info" 
                        onClick={(e) => { updatePublishDate(editingPost.id); handleCloseModal(); }}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
                        Tarih Güncelle
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={(e) => { archiveBlogPost(editingPost.id); handleCloseModal(); }}
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faArchive} className="me-2" />
                        Arşive Al
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="success" 
                      onClick={(e) => { e.stopPropagation(); publishBlogPost(editingPost.id); handleCloseModal(); }}
                      disabled={isSubmitting}
                    >
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
                      Yayınla
                    </Button>
                  )}
                </>
              )}
            </div>
            <div>
              <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                İptal
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Blog Yayınlama Teklif Modalı */}
        <Modal 
          show={showPublishPrompt} 
          onHide={handleClosePublishPrompt}
          centered
          size="lg"
        >
          <Modal.Header closeButton style={{ backgroundColor: colors.light }}>
            <Modal.Title>Blog Yazısı Oluşturuldu</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="success">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Blog yazınız başarıyla oluşturuldu ve taslak olarak kaydedildi.
            </Alert>
            <p>Blog yazınızı şimdi yayınlamak ister misiniz?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClosePublishPrompt}>
              Hayır, Taslak Olarak Kalsın
            </Button>
            <Button 
              variant="success" 
              onClick={() => {
                if (newlyCreatedBlogId) {
                  publishBlogPost(newlyCreatedBlogId);
                  handleClosePublishPrompt();
                }
              }}
            >
              <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
              Evet, Şimdi Yayınla
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default BlogPage; 
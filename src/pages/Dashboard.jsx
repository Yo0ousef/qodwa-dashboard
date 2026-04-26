import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Save, Plus, Trash2 } from 'lucide-react';

export default function Dashboard({ session }) {
  const [table, setTable] = useState('Sa7aba');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Records state
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    lineage: '',
    looks: '',
    sons: '',
    death: '',
  });

  const [stories, setStories] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, [table]);

  const fetchRecords = async () => {
    setFetchLoading(true);
    const { data, error } = await supabase.from(table).select('id, name, nickname, lineage, looks, sons, death, stories, resources').order('name');
    if (!error && data) {
      setRecords(data);
    }
    handleClearSelection();
    setFetchLoading(false);
  };

  const handleClearSelection = () => {
    setSelectedRecordId('');
    setFormData({
      nickname: '',
      name: '',
      lineage: '',
      looks: '',
      sons: '',
      death: '',
    });
    setStories([]);
    setResources([]);
  };

  const handleSelectRecord = (e) => {
    const id = e.target.value;
    setSelectedRecordId(id);
    if (!id) {
      handleClearSelection();
      return;
    }

    const record = records.find(r => r.id.toString() === id);
    if (record) {
      setFormData({
        nickname: record.nickname || '',
        name: record.name || '',
        lineage: record.lineage || '',
        looks: record.looks || '',
        sons: record.sons || '',
        death: record.death || '',
      });

      const parsedStories = [];
      if (record.stories) {
        Object.keys(record.stories).forEach(key => {
          parsedStories.push({
            title: record.stories[key]?.title || '',
            content: record.stories[key]?.content || ''
          });
        });
      }
      setStories(parsedStories);

      const parsedResources = [];
      if (record.resources) {
        Object.keys(record.resources).forEach(key => {
          parsedResources.push({
            title: record.resources[key]?.title || '',
            content: record.resources[key]?.content || ''
          });
        });
      }
      setResources(parsedResources);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (setter, index, field, value) => {
    setter((prev) => {
      const newItems = [...prev];
      newItems[index][field] = value;
      return newItems;
    });
  };

  const addDynamicItem = (setter) => {
    setter((prev) => [...prev, { title: '', content: '' }]);
  };

  const removeDynamicItem = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const convertToMap = (items) => {
    const map = {};
    items.forEach((item, index) => {
      if (item.title || item.content) {
        map[`item_${Date.now()}_${index}`] = {
          title: item.title,
          content: item.content
        };
      }
    });
    return map;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const payload = {
      nickname: formData.nickname,
      name: formData.name,
      lineage: formData.lineage,
      looks: formData.looks,
      sons: formData.sons,
      death: formData.death,
      stories: convertToMap(stories),
      resources: convertToMap(resources),
    };

    let errorMsg = null;

    if (selectedRecordId) {
      // Update
      const { error } = await supabase.from(table).update(payload).eq('id', selectedRecordId);
      if (error) errorMsg = error.message;
    } else {
      // Insert
      const { error } = await supabase.from(table).insert([payload]);
      if (error) errorMsg = error.message;
    }

    if (errorMsg) {
      setMessage({ text: `خطأ في الحفظ: ${errorMsg}`, type: 'error' });
    } else {
      setMessage({ text: 'تم الحفظ بنجاح!', type: 'success' });
      fetchRecords(); // Refresh data and clear form
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>لوحة تحكم قدوة</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>إضافة البيانات إلى التطبيق</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          <span>تسجيل الخروج</span>
          <LogOut size={18} />
        </button>
      </header>

      {message.text && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '0.5rem',
          backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
          border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--success)'}`
        }}>
          {message.text}
        </div>
      )}

      <main className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '1.1rem' }}>اختر الجدول</label>
            <select value={table} onChange={(e) => setTable(e.target.value)} style={{ fontSize: '1.1rem', padding: '1rem' }}>
              <option value="Sa7aba">الصحابة</option>
              <option value="Sa7abiat">الصحابيات</option>
              <option value="Tabi3een">التابعين</option>
              <option value="Tabi3at">التابعیات</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem', padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <label className="form-label" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>تعديل شخصية موجودة أو إضافة جديدة؟</label>
            {fetchLoading ? (
              <p className="form-help" style={{ marginTop: '0.5rem' }}>جاري جلب الأسماء...</p>
            ) : (
              <select value={selectedRecordId} onChange={handleSelectRecord} style={{ fontSize: '1.1rem', padding: '1rem', marginTop: '0.5rem' }}>
                <option value="">--- 🆕 إضافة شخصية جديدة ---</option>
                {records.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nickname ? r.nickname : r.name}
                  </option>
                ))}
              </select>
            )}
            {selectedRecordId && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleClearSelection} className="btn-secondary" style={{ fontSize: '0.9rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  إلغاء التحديد (إنشاء جديد)
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">اللقب <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="nickname" value={formData.nickname} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">الاسم <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">النسب <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="text" name="lineage" value={formData.lineage} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">الصفات الشكلية</label>
              <input type="text" name="looks" value={formData.looks} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label className="form-label">الأبناء</label>
              <input type="text" name="sons" value={formData.sons} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label className="form-label">الوفاة </label>
              <input type="text" name="death" value={formData.death} onChange={handleInputChange} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />

          {/* Stories Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>القصص (Stories)</h2>
              <button type="button" onClick={() => addDynamicItem(setStories)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> إضافة قصة
              </button>
            </div>

            {stories.length === 0 && <p className="form-help">لا توجد قصص مضافة.</p>}

            {stories.map((story, index) => (
              <div key={index} className="dynamic-field-item">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="عنوان القصة"
                    value={story.title}
                    onChange={(e) => handleDynamicChange(setStories, index, 'title', e.target.value)}
                  />
                  <textarea
                    placeholder="محتوى القصة"
                    value={story.content}
                    onChange={(e) => handleDynamicChange(setStories, index, 'content', e.target.value)}
                    rows={3}
                  />
                </div>
                <button type="button" onClick={() => removeDynamicItem(setStories, index)} className="btn-danger" title="حذف">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Resources Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>المصادر (Resources)</h2>
              <button type="button" onClick={() => addDynamicItem(setResources)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> إضافة مصدر
              </button>
            </div>

            {resources.length === 0 && <p className="form-help">لا توجد مصادر مضافة.</p>}

            {resources.map((resource, index) => (
              <div key={index} className="dynamic-field-item">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="اسم/عنوان المصدر"
                    value={resource.title}
                    onChange={(e) => handleDynamicChange(setResources, index, 'title', e.target.value)}
                  />
                  <textarea
                    placeholder="رابط أو تفاصيل المصدر"
                    value={resource.content}
                    onChange={(e) => handleDynamicChange(setResources, index, 'content', e.target.value)}
                    rows={2}
                  />
                </div>
                <button type="button" onClick={() => removeDynamicItem(setResources, index)} className="btn-danger" title="حذف">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
              {loading ? 'جاري الحفظ...' : (
                <>
                  <Save size={20} />
                  <span>حفظ البيانات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

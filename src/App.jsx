import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiDownload, FiUpload, FiTrash, FiEdit, FiSave, FiX, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const emptyEntry = {
    title: '',
    paths: [{ url: '', active: true }],
    tvgId: '',
    tvgName: '',
    tvgLogo: '',
    tvgRes: '',
    groupTitle: ''
  };
  const [newEntry, setNewEntry] = useState(emptyEntry);
  const [editEntry, setEditEntry] = useState(emptyEntry);

  const addEntry = () => {
    if (newEntry.title && newEntry.paths.some(p => p.url)) {
      setPlaylist([...playlist, { ...newEntry, id: Date.now() }]);
      setNewEntry(emptyEntry);
    }
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditEntry(entry);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditEntry(emptyEntry);
  };

  const saveEdit = () => {
    if (editEntry.title && editEntry.paths.some(p => p.url)) {
      setPlaylist(playlist.map(entry => 
        entry.id === editingId ? { ...editEntry } : entry
      ));
      setEditingId(null);
      setEditEntry(emptyEntry);
    }
  };

  const removeEntry = (id) => {
    setPlaylist(playlist.filter(entry => entry.id !== id));
  };

  const clearAllEntries = () => {
    setPlaylist([]);
  };

  const addPath = (entry, setEntry) => {
    setEntry({
      ...entry,
      paths: [...entry.paths, { url: '', active: true }]
    });
  };

  const removePath = (entry, setEntry, index) => {
    if (entry.paths.length > 1) {
      setEntry({
        ...entry,
        paths: entry.paths.filter((_, i) => i !== index)
      });
    }
  };

  const updatePath = (entry, setEntry, index, url, active = null) => {
    const newPaths = [...entry.paths];
    newPaths[index] = {
      ...newPaths[index],
      url,
      active: active !== null ? active : newPaths[index].active
    };
    setEntry({ ...entry, paths: newPaths });
  };

  const exportPlaylist = () => {
    const content = '#EXTM3U\n' + playlist.map(entry => {
      const activePaths = entry.paths.filter(p => p.active);
      const inactivePaths = entry.paths.filter(p => !p.active);
      
      return `#EXTINF:-1 tvg-id="${entry.tvgId}" tvg-name="${entry.tvgName}" tvg-logo="${entry.tvgLogo}" tvg-res="${entry.tvgRes}" group-title="${entry.groupTitle}",${entry.title}\n` +
        activePaths.map(p => p.url).join('\n') +
        (inactivePaths.length > 0 ? '\n' + inactivePaths.map(p => '#' + p.url).join('\n') : '');
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.m3u';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlaylist = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split('\n');
        const newPlaylist = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#EXTINF:')) {
            const extinf = lines[i];
            const paths = [];
            i++;
            
            // Collect all paths until next EXTINF or end
            while (i < lines.length && !lines[i].startsWith('#EXTINF:')) {
              const line = lines[i].trim();
              if (line) {
                paths.push({
                  url: line.startsWith('#') ? line.substring(1) : line,
                  active: !line.startsWith('#')
                });
              }
              i++;
            }
            i--; // Step back one line since we'll increment in the outer loop
            
            // Parse EXTINF line
            const tvgId = (extinf.match(/tvg-id="([^"]*)"/) || [])[1] || '';
            const tvgName = (extinf.match(/tvg-name="([^"]*)"/) || [])[1] || '';
            const tvgLogo = (extinf.match(/tvg-logo="([^"]*)"/) || [])[1] || '';
            const tvgRes = (extinf.match(/tvg-res="([^"]*)"/) || [])[1] || '';
            const groupTitle = (extinf.match(/group-title="([^"]*)"/) || [])[1] || '';
            const title = extinf.split(',').pop();

            newPlaylist.push({
              id: Date.now() + i,
              title,
              paths,
              tvgId,
              tvgName,
              tvgLogo,
              tvgRes,
              groupTitle
            });
          }
        }
        
        setPlaylist(newPlaylist);
      };
      reader.readAsText(file);
    }
  };

  const renderPathInputs = (entry, onChange, isEditing = false) => (
    <div className="space-y-2">
      {entry.paths.map((path, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={path.active}
            onChange={(e) => onChange(entry, index, path.url, e.target.checked)}
            className="w-4 h-4"
          />
          <input
            type="text"
            placeholder="Path or URL"
            className="border rounded p-2 flex-1"
            value={path.url}
            onChange={(e) => onChange(entry, index, e.target.value)}
          />
          <button
            onClick={() => removePath(entry, setNewEntry, index)}
            className="text-red-500 hover:text-red-700"
            disabled={entry.paths.length === 1}
          >
            <FiMinusCircle size={20} />
          </button>
        </div>
      ))}
      <button
        onClick={() => addPath(entry, setNewEntry)}
        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
      >
        <FiPlusCircle /> Add Alternative Path
      </button>
    </div>
  );

  const renderEntryForm = (entry, onChange, isEditing = false) => (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Title"
          className="border rounded p-2"
          value={entry.title}
          onChange={(e) => onChange({ ...entry, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="TVG ID"
          className="border rounded p-2"
          value={entry.tvgId}
          onChange={(e) => onChange({ ...entry, tvgId: e.target.value })}
        />
        <input
          type="text"
          placeholder="TVG Name"
          className="border rounded p-2"
          value={entry.tvgName}
          onChange={(e) => onChange({ ...entry, tvgName: e.target.value })}
        />
        <input
          type="text"
          placeholder="TVG Logo URL"
          className="border rounded p-2"
          value={entry.tvgLogo}
          onChange={(e) => onChange({ ...entry, tvgLogo: e.target.value })}
        />
        <input
          type="text"
          placeholder="TVG Resolution"
          className="border rounded p-2"
          value={entry.tvgRes}
          onChange={(e) => onChange({ ...entry, tvgRes: e.target.value })}
        />
        <input
          type="text"
          placeholder="Group Title"
          className="border rounded p-2"
          value={entry.groupTitle}
          onChange={(e) => onChange({ ...entry, groupTitle: e.target.value })}
        />
      </div>
      {renderPathInputs(entry, updatePath, isEditing)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">M3U Playlist Editor</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {renderEntryForm(newEntry, setNewEntry)}
          <button
            onClick={addEntry}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600"
          >
            <FiPlus /> Add Entry
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={exportPlaylist}
              className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600"
            >
              <FiDownload /> Export M3U
            </button>
            <label className="bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-600 cursor-pointer">
              <FiUpload /> Import M3U
              <input
                type="file"
                accept=".m3u,.m3u8"
                className="hidden"
                onChange={importPlaylist}
              />
            </label>
            <button
              onClick={clearAllEntries}
              className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-600"
            >
              <FiTrash /> Clear All
            </button>
          </div>

          <div className="space-y-4">
            {playlist.map((entry) => (
              <div
                key={entry.id}
                className="border rounded p-4"
              >
                {editingId === entry.id ? (
                  <>
                    {renderEntryForm(editEntry, setEditEntry, true)}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600"
                      >
                        <FiSave /> Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-600"
                      >
                        <FiX /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{entry.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(entry)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit size={20} />
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {entry.paths.map((path, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className={`flex-1 ${path.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                            {path.url}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                            {path.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                      <p>TVG ID: {entry.tvgId}</p>
                      <p>TVG Name: {entry.tvgName}</p>
                      <p>TVG Logo: {entry.tvgLogo}</p>
                      <p>TVG Resolution: {entry.tvgRes}</p>
                      <p>Group: {entry.groupTitle}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
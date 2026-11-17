import React from 'react';
import { FiX, FiUpload, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  PRESET_VARIANT_COLORS,
  getColorNameFromHex,
  isSavedImageUrl,
  isUsableImageUrl,
} from './colorUtils';

/**
 * Images tab for ProductModal — general gallery, 3D model, color variants.
 * Kept separate so color/image edits do not thrash the huge ProductModal file.
 */
const ProductImagesTab = ({
  t,
  isEyeHygiene,
  canManageColorVariants,
  // general images
  imagePreviews,
  existingImages,
  setImagesDirty,
  setImageFiles,
  setImagePreviews,
  setExistingImages,
  removeImage,
  handleGeneralImageChange,
  // 3D
  model3DPreview,
  model3DFile,
  removeModel3D,
  handleModel3DChange,
  // color variants
  imagesWithColors,
  existingColorImages,
  pendingVariantHexes,
  setColorImagesDirty,
  setImagesWithColors,
  setExistingColorImages,
  setPendingVariantHexes,
  customVariantHexInput,
  setCustomVariantHexInput,
  addVariantRow,
  removeVariantHex,
  removeImageWithColor,
  handleVariantImagesChange,
  variantHexListOrdered,
  variantUploadHex,
}) => {
  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('generalProductImages')}</h3>
          <p className="text-xs text-gray-600 mt-1">
            Main gallery images (not tied to a frame color). Use these for listings and hero shots.
          </p>
        </div>
        {imagePreviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {t('selectedImages')} ({imagePreviews.length})
              </p>
              <button
                type="button"
                onClick={() => {
                  setImagesDirty(true);
                  setImageFiles([]);
                  setImagePreviews([]);
                  setExistingImages([]);
                  toast.success(t('clearAll'));
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                {t('clearAll')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => {
                const isExisting = isSavedImageUrl(preview) && existingImages.includes(preview);
                return (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`General ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-xl border-2 shadow-md hover:border-indigo-400 transition-all ${isExisting ? 'border-blue-300' : 'border-gray-200'}`}
                      onError={() => {
                        toast.error(`Failed to display image ${index + 1}`);
                        removeImage(index);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 z-10"
                      title="Remove image"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs text-center py-1.5 rounded-b-xl ${isExisting ? 'bg-blue-600/80' : ''}`}>
                      {isExisting ? 'Existing' : 'New'} · General
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <label
          htmlFor="general-image-input"
          className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center py-6 px-4">
            <FiUpload className="w-8 h-8 text-indigo-500 mb-2" />
            <p className="text-sm font-semibold text-gray-800">
              {imagePreviews.length > 0 ? t('addMoreImages') : t('clickToSelectMultipleImages')}
            </p>
            <p className="text-xs text-gray-500 mt-1 text-center">{t('supportedFormats')} · {t('multipleSelectionSupported')}</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGeneralImageChange}
            className="hidden"
            id="general-image-input"
          />
        </label>
      </div>

      {!isEyeHygiene && (
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('model3D')} <span className="text-gray-500 text-xs font-normal">({t('optional')})</span>
          </label>
          <div className="space-y-4">
            {model3DPreview && (
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    {t('model3D')} {t('selected')}
                  </p>
                  <button
                    type="button"
                    onClick={removeModel3D}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {model3DFile ? model3DFile.name : '3D Model'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {model3DFile ? `${(model3DFile.size / 1024 / 1024).toFixed(2)} MB` : 'Existing model'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <label
              htmlFor="product-3d-model-input"
              className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {model3DPreview ? 'Replace 3D Model' : 'Click to Upload 3D Model'}
                </p>
                <p className="text-xs text-gray-600 text-center">
                  Supported: GLB, GLTF, OBJ, FBX, DAE
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center">Max size: 50MB</p>
              </div>
              <input
                type="file"
                accept=".glb,.gltf,.obj,.fbx,.dae"
                onChange={handleModel3DChange}
                className="hidden"
                id="product-3d-model-input"
              />
            </label>
          </div>
        </div>
      )}

      {!isEyeHygiene && canManageColorVariants && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t('imagesWithColorCodes')}</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Step 1: Add a color variant. Step 2: Upload photos for that color. Each variant shows the right images when customers pick that color.
              </p>
            </div>
            {(imagesWithColors.length > 0 || existingColorImages.length > 0 || pendingVariantHexes.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setColorImagesDirty(true);
                  setImagesWithColors([]);
                  setExistingColorImages([]);
                  setPendingVariantHexes([]);
                  toast.success('All color variants cleared');
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear all color variants
              </button>
            )}
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">1 · Add a color</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_VARIANT_COLORS.map(({ hex, name }) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => addVariantRow(hex)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 hover:border-indigo-400 hover:bg-indigo-50/80 transition-colors"
                >
                  <span className="w-5 h-5 rounded border border-gray-300 shadow-inner" style={{ backgroundColor: hex }} />
                  {name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom hex</label>
                <input
                  type="text"
                  value={customVariantHexInput}
                  onChange={(e) => setCustomVariantHexInput(e.target.value)}
                  placeholder="#RRGGBB"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => addVariantRow(customVariantHexInput)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                <FiPlus className="w-4 h-4" />
                Add variant
              </button>
            </div>
          </div>

          {variantHexListOrdered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              No color variants yet. Use the presets or a custom hex above, then add photos under each variant.
            </p>
          )}

          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">2 · Photos per color</p>
            {variantHexListOrdered.map((hex) => {
              const variantImages = imagesWithColors.filter(
                (img) =>
                  img.hexCode &&
                  img.hexCode.toUpperCase() === hex &&
                  (isUsableImageUrl(img.preview) ||
                    (typeof File !== 'undefined' && img.file instanceof File))
              );
              const safeInputId = `variant-img-${hex.replace(/[^a-zA-Z0-9]/g, '')}`;
              return (
                <div key={hex} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-lg border-2 border-white shadow shrink-0 ring-1 ring-gray-200"
                        style={{ backgroundColor: hex }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getColorNameFromHex(hex)}
                        </p>
                        <p className="text-xs font-mono text-gray-500">{hex}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariantHex(hex)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Remove variant
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {variantImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {variantImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt=""
                              className="w-full h-28 object-cover rounded-lg border border-gray-200"
                              onError={() => {
                                // Drop 404 tiles silently; Save persists the cleanup
                                if (typeof removeImageWithColor === 'function') {
                                  removeImageWithColor(img.id, { silent: true });
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImageWithColor(img.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No photos for this color yet.</p>
                    )}
                    {variantUploadHex === hex ? (
                      <div
                        className="flex items-center justify-center gap-2 w-full py-3 px-3 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/40 text-indigo-800"
                        aria-busy="true"
                      >
                        <span className="inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Uploading…</span>
                      </div>
                    ) : (
                      <label
                        htmlFor={safeInputId}
                        className="flex items-center justify-center gap-2 w-full py-3 px-3 border-2 border-dashed border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50/60 transition-colors"
                      >
                        <FiUpload className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">
                          Add photos for {getColorNameFromHex(hex)}
                        </span>
                        <input
                          id={safeInputId}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleVariantImagesChange(hex, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isEyeHygiene && !canManageColorVariants && (
        <div className="border-t border-gray-200 pt-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Color variants</p>
            <p className="text-xs mt-1 text-amber-900/90">
              Save the product first, then open it again to add frame colors and photos per color. General images above can be added anytime.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductImagesTab;

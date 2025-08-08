import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, Scissors, Download } from "lucide-react";
import OpenAI from "openai";

interface CustomOption {
  value: string;
  label: string;
}

interface BadgeSelectionProps {
  label: string;
  options: CustomOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

interface GPTImageEditParams {
  model: string;
  image: File;
  prompt: string;
  n: number;
  size:
    | "1024x1024"
    | "auto"
    | "256x256"
    | "512x512"
    | "1536x1024"
    | "1024x1536";
  quality: "high" | "auto" | "standard" | "low" | "medium";
  background?: "transparent" | "opaque" | "auto";
}

interface GPTImageGenerateParams {
  model: string;
  prompt: string;
  n: number;
  size:
    | "1024x1024"
    | "auto"
    | "256x256"
    | "512x512"
    | "1536x1024"
    | "1024x1536"
    | "1792x1024"
    | "1024x1792";
  quality: "high" | "auto" | "standard" | "low" | "medium" | "hd";
  background?: "transparent" | "opaque" | "auto";
}

interface ColorData {
  name: string;
  color: string;
}

interface ColorLevel {
  [key: string]: ColorData;
}

interface ColorChart {
  [key: number]: ColorLevel;
}

// 髪の長さ
const hairLengthOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "long hair", label: "ロング" },
  { value: "semi-long hair", label: "セミロング" },
  { value: "medium-length hair", label: "ミディアム" },
  { value: "bob cut", label: "ボブ" },
  { value: "short bob cut", label: "ショートボブ" },
  { value: "short hair", label: "ショート" },
  { value: "very short hair", label: "ベリーショート" },
];

// シルエット
const silhouetteOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "A-line silhouette", label: "Aライン" },
  { value: "Straight I-line silhouette", label: "Iライン" },
  { value: "Diamond-shaped hairstyle", label: "ひし形" },
  { value: "volume at the top and narrow at the bottom", label: "逆三角形" },
  { value: "creating a curvy silhouette", label: "くびれ" },
  {
    value: "Forward-angled bob with longer front pieces and shorter back",
    label: "前下がり",
  },
  {
    value: "Reverse-angled bob with shorter front and longer back",
    label: "前上がり",
  },
  { value: "Rounded silhouette", label: "丸みシルエット" },
];

// パーマ
const permOptions: CustomOption[] = [
  { value: "perm hair", label: "あり" },
  { value: "", label: "なし" },
];

// 髪の動き
const hairMovementOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "curly hair", label: "ナチュラルカール" },
  { value: "messy and natural texture", label: "無造作" },
  { value: "one-curl ends", label: "毛先ワンカール" },
  { value: "sleek straight hair", label: "ストレート" },
  { value: "soft wavy hairstyle", label: "ウェーブ" },
  { value: "inwardly curled hair", label: "内巻き" },
  { value: "outward-flipped ends", label: "外ハネ" },
  { value: "layered layers with a narrowed-in waist", label: "くびれ" },
];

// 質感
const textureOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "lightweight texture", label: "軽め" },
  { value: "heavy texture with density", label: "重め" },
  { value: "soft and smooth texture", label: "柔らかい" },
  { value: "glossy hair with shine", label: "ツヤ" },
  { value: "semi-gloss finish", label: "セミツヤ" },
  { value: "matte finish", label: "マット" },
  { value: "glossy hair", label: "ウェット" },
  { value: "dry texture with volume", label: "ドライ" },
  { value: "defined hair strands", label: "束感" },
  { value: "see-through layers", label: "透け感" },
];

// 髪質
const hairQualityOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "thin and delicate hair strands", label: "細い" },
  { value: "medium thickness hair", label: "普通" },
  { value: "thick hair", label: "太い" },
];

// レイヤーの構成
const layerOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "one-length cut with no layers", label: "ワンレングス（段無し）" },
  {
    value: "low layers around the bottom",
    label: "ローレイヤー（低い位置に段）",
  },
  {
    value: "medium layers for natural movement",
    label: "ミディアムレイヤー（中間位置に段）",
  },
  {
    value: "layering from the top for lightness",
    label: "ハイレイヤー（高い位置に段）",
  },
  { value: "uniform layers throughout", label: "セイムレイヤー（均等に段）" },
];

// ライティング
const lightingOptions: CustomOption[] = [
  { value: "", label: "指定なし" },
  { value: "frontal lighting", label: "正面光" },
  { value: "side lighting", label: "サイド光" },
  { value: "light coming from above", label: "トップ光" },
];

// 髪型カテゴリー（コメントアウト - 現在未使用）
// const hairCategories = [
//   "ショート",
//   "ボブ",
//   "ミディアム",
//   "ロング",
//   "メンズ",
//   "アレンジ",
//   "パーマ",
//   "ストレート",
// ];

// 髪色データの定義
const blackHairBaseColors: ColorChart = {
  10: {
    CB: { name: "Cool Brown", color: "#6c6247" },
    B: { name: "Brown", color: "#6b5337" },
    WB: { name: "Warm Brown", color: "#6f4a33" },
    PBe: { name: "Pink Beige", color: "#865050" },
    OBe: { name: "Orange Beige", color: "#8c6649" },
    Be: { name: "Beige", color: "#897250" },
    Abe: { name: "Ash Beige", color: "#6c6a6b" },
    Gr: { name: "Grege", color: "#716758" },
    Ma: { name: "mauve", color: "#87616c" },
    Mt: { name: "Metallic", color: "#6b695d" },
    R: { name: "Red", color: "#7e353f" },
    K: { name: "Cooper", color: "#89432a" },
    O: { name: "Orange", color: "#98572a" },
    G: { name: "Gold", color: "#80693d" },
    M: { name: "Matt", color: "#6a5b3b" },
    A: { name: "Ash", color: "#71746d" },
    CA: { name: "Cobalt Ash", color: "#616669" },
    V: { name: "Violet", color: "#6b4d59" },
    P: { name: "Pink", color: "#843c4e" },
  },
  9: {
    CB: { name: "Cool Brown", color: "#57492e" },
    B: { name: "Brown", color: "#574029" },
    WB: { name: "Warm Brown", color: "#624130" },
    PBe: { name: "Pink Beige", color: "#704041" },
    OBe: { name: "Orange Beige", color: "#6f4f3a" },
    Be: { name: "Beige", color: "#705a38" },
    Abe: { name: "Ash Beige", color: "#595453" },
    Gr: { name: "Grege", color: "#5f574b" },
    Ma: { name: "mauve", color: "#785762" },
    Mt: { name: "Metallic", color: "#5e5a51" },
  },
  8: {
    CB: { name: "Cool Brown", color: "#53472d" },
    B: { name: "Brown", color: "#4c3723" },
    WB: { name: "Warm Brown", color: "#50311f" },
    PBe: { name: "Pink Beige", color: "#5e2d30" },
    OBe: { name: "Orange Beige", color: "#5d3d28" },
    Be: { name: "Beige", color: "#675139" },
    Abe: { name: "Ash Beige", color: "#4e4a49" },
    Gr: { name: "Grege", color: "#524c40" },
    Ma: { name: "mauve", color: "#694b55" },
    Mt: { name: "Metallic", color: "#514c46" },
    R: { name: "Red", color: "#55131d" },
    K: { name: "Cooper", color: "#602112" },
    O: { name: "Orange", color: "#733713" },
    G: { name: "Gold", color: "#634d28" },
    M: { name: "Matt", color: "#40320f" },
    A: { name: "Ash", color: "#43443e" },
    CA: { name: "Cobalt Ash", color: "#384243" },
    V: { name: "Violet", color: "#48303d" },
    P: { name: "Pink", color: "#592235" },
  },
  7: {
    CB: { name: "Cool Brown", color: "#382715" },
    B: { name: "Brown", color: "#3b2516" },
    WB: { name: "Warm Brown", color: "#38180e" },
    PBe: { name: "Pink Beige", color: "#4f2121" },
    OBe: { name: "Orange Beige", color: "#4b2f20" },
    Be: { name: "Beige", color: "#4e3820" },
    Abe: { name: "Ash Beige", color: "#413b3b" },
    Gr: { name: "Grege", color: "#484139" },
    Ma: { name: "mauve", color: "#573d4b" },
    Mt: { name: "Metallic", color: "#404038" },
  },
  6: {
    CB: { name: "Cool Brown", color: "#1c0a01" },
    B: { name: "Brown", color: "#1d0900" },
    WB: { name: "Warm Brown", color: "#250603" },
    PBe: { name: "Pink Beige", color: "#370705" },
    OBe: { name: "Orange Beige", color: "#371605" },
    Be: { name: "Beige", color: "#341b07" },
    Abe: { name: "Ash Beige", color: "#231f1e" },
    Gr: { name: "Grege", color: "#393430" },
    Ma: { name: "mauve", color: "#402a36" },
    Mt: { name: "Metallic", color: "#1c1e1b" },
    R: { name: "Red", color: "#2c0000" },
    K: { name: "Cooper", color: "#420804" },
    O: { name: "Orange", color: "#461c02" },
    G: { name: "Gold", color: "#392713" },
    M: { name: "Matt", color: "#2a1500" },
    A: { name: "Ash", color: "#16110b" },
    CA: { name: "Cobalt Ash", color: "#121318" },
    V: { name: "Violet", color: "#241721" },
    P: { name: "Pink", color: "#2b0102" },
  },
  5: {
    CB: { name: "Cool Brown", color: "#180502" },
    B: { name: "Brown", color: "#1a0402" },
    WB: { name: "Warm Brown", color: "#1d0002" },
  },
  4: {
    CB: { name: "Cool Brown", color: "#0c0000" },
    WB: { name: "Warm Brown", color: "#0e0101" },
  },
  3: {
    CB: { name: "Cool Brown", color: "#050000" },
    WB: { name: "Warm Brown", color: "#050000" },
  },
};

const bleachBaseColors: ColorChart = {
  15: {
    Be: { name: "Beige", color: "#a07f60" },
    Mt: { name: "Metallic", color: "#7e8283" },
    R: { name: "Red", color: "#772636" },
    O: { name: "Orange", color: "#bb5639" },
    CA: { name: "Cobalt Ash", color: "#81a2c1" },
    V: { name: "Violet", color: "#611735" },
  },
  14: {
    CB: { name: "Cool Brown", color: "#ddd8c4" },
  },
  13: {
    // 空のレベル
  },
  12: {
    CB: { name: "Cool Brown", color: "#d3caac" },
    PBe: { name: "Pink Beige", color: "#f9ccce" },
    OBe: { name: "Orange Beige", color: "#fcceae" },
    Be: { name: "Beige", color: "#ddcdb3" },
    Abe: { name: "Ash Beige", color: "#bfb7c2" },
    Pe: { name: "Perl", color: "#d8d0cd" },
    O: { name: "Orange", color: "#ec9558" },
    G: { name: "Gold", color: "#d2af6a" },
    M: { name: "Matt", color: "#abc19b" },
    L: { name: "Lime", color: "#9fbca8" },
    A: { name: "Ash", color: "#bab8c6" },
    CA: { name: "Cobalt Ash", color: "#a8b8d2" },
  },
  11: {
    // 空のレベル
  },
  10: {
    CB: { name: "Cool Brown", color: "#c4bc98" },
    B: { name: "Brown", color: "#c8b58b" },
    WB: { name: "Warm Brown", color: "#e8c6a3" },
    PBe: { name: "Pink Beige", color: "#d08c8d" },
    OBe: { name: "Orange Beige", color: "#e3a782" },
    Be: { name: "Beige", color: "#c1a88a" },
    Abe: { name: "Ash Beige", color: "#9992a2" },
    Pe: { name: "Perl", color: "#b4a5a2" },
    Mt: { name: "Metallic", color: "#a79f9c" },
    R: { name: "Red", color: "#b64c50" },
    K: { name: "Cooper", color: "#a95036" },
    O: { name: "Orange", color: "#dd7440" },
    G: { name: "Gold", color: "#ba9b5b" },
    M: { name: "Matt", color: "#8ba983" },
    L: { name: "Lime", color: "#82a388" },
    A: { name: "Ash", color: "#8e98b3" },
    CA: { name: "Cobalt Ash", color: "#6f91b6" },
    V: { name: "Violet", color: "#776a98" },
  },
  9: {
    CB: { name: "Cool Brown", color: "#8c876a" },
    B: { name: "Brown", color: "#938266" },
    WB: { name: "Warm Brown", color: "#b29279" },
  },
  8: {
    CB: { name: "Cool Brown", color: "#716b53" },
    B: { name: "Brown", color: "#78684f" },
    WB: { name: "Warm Brown", color: "#7b6152" },
    PBe: { name: "Pink Beige", color: "#814c48" },
    OBe: { name: "Orange Beige", color: "#9c5c38" },
    Be: { name: "Beige", color: "#7b6651" },
    Abe: { name: "Ash Beige", color: "#736b76" },
    Pe: { name: "Perl", color: "#907b76" },
    Mt: { name: "Metallic", color: "#635e58" },
    R: { name: "Red", color: "#872d36" },
    K: { name: "Cooper", color: "#8e3f30" },
    O: { name: "Orange", color: "#a64b3d" },
    G: { name: "Gold", color: "#9a7741" },
    M: { name: "Matt", color: "#658c62" },
    L: { name: "Lime", color: "#6c896f" },
    A: { name: "Ash", color: "#6a6d7e" },
    CA: { name: "Cobalt Ash", color: "#466287" },
    V: { name: "Violet", color: "#645888" },
  },
  7: {
    CB: { name: "Cool Brown", color: "#4f4d39" },
    B: { name: "Brown", color: "#514737" },
    WB: { name: "Warm Brown", color: "#634f40" },
  },
  6: {
    CB: { name: "Cool Brown", color: "#363320" },
    B: { name: "Brown", color: "#362c20" },
    WB: { name: "Warm Brown", color: "#422c21" },
    PBe: { name: "Pink Beige", color: "#4f2d2c" },
    OBe: { name: "Orange Beige", color: "#632c17" },
    Be: { name: "Beige", color: "#493a27" },
    Abe: { name: "Ash Beige", color: "#47414b" },
    Mt: { name: "Metallic", color: "#484340" },
    R: { name: "Red", color: "#601325" },
    K: { name: "Cooper", color: "#64281e" },
    O: { name: "Orange", color: "#8b3f32" },
    M: { name: "Matt", color: "#4e5136" },
    A: { name: "Ash", color: "#353f4b" },
    CA: { name: "Cobalt Ash", color: "#1e3352" },
    V: { name: "Violet", color: "#4b396d" },
  },
  5: {
    CB: { name: "Cool Brown", color: "#282713" },
    B: { name: "Brown", color: "#272112" },
    WB: { name: "Warm Brown", color: "#342019" },
  },
  4: {
    R: { name: "Red", color: "#4a0017" },
    V: { name: "Violet", color: "#372648" },
  },
  3: {
    CB: { name: "Cool Brown", color: "#030303" },
    WB: { name: "Warm Brown", color: "#180400" },
  },
  2: {
    CA: { name: "Cobalt Ash", color: "#101e45" },
  },
  1: {
    R: { name: "Red", color: "#692232" },
    L: { name: "Lime", color: "#053621" },
    CA: { name: "Cobalt Ash", color: "#092950" },
  },
};

// Badge Selection Component
const BadgeSelection: React.FC<BadgeSelectionProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isDefault = option.value === "";

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isSelected
                  ? isDefault
                    ? "bg-gray-100 text-gray-700 border-gray-300 ring-2 ring-gray-400"
                    : "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-md"
                  : isDefault
                  ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  : "bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// OpenAI 設定
const getOpenAIClient = () => {
  const apiKey =
    import.meta.env.VITE_GPT_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI APIキーが設定されていません。.envファイルを確認してください。"
    );
  }

  console.log("API Key found:", apiKey.substring(0, 10) + "...");

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.openai.com/v1",
  });
};

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isBlackBase, setIsBlackBase] = useState(true); // 黒髪ベースかブリーチベースかのトグル
  const [selectedColorCode, setSelectedColorCode] = useState<string>(""); // 選択されたカラーコード

  // 8つの新しいカテゴリーの状態
  const [hairLength, setHairLength] = useState("");
  const [silhouette, setSilhouette] = useState("");
  const [perm, setPerm] = useState(""); // デフォルト: なし
  const [hairMovement, setHairMovement] = useState("");
  const [texture, setTexture] = useState("");
  const [hairQuality, setHairQuality] = useState("");
  const [layers, setLayers] = useState("");
  const [lighting, setLighting] = useState("");

  // GPT Image 1新パラメータ
  const [imageQuality, setImageQuality] = useState("high");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [backgroundTransparent, setBackgroundTransparent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [promptText, setPromptText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Fileオブジェクトを保存（API用）
      setSelectedImageFile(file);

      // 表示用URLを作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // プロンプト生成関数
  const generatePrompt = () => {
    const styleParts = [];

    // 選択されたオプションのみを使用
    if (hairLength) styleParts.push(hairLength);
    if (silhouette) styleParts.push(silhouette);
    if (perm) styleParts.push(perm);
    if (hairMovement) styleParts.push(hairMovement);
    if (texture) styleParts.push(texture);
    if (hairQuality) styleParts.push(hairQuality);
    if (layers) styleParts.push(layers);
    if (lighting) styleParts.push(lighting);

    let prompt = "make her hairstyle ";

    // 選択されたオプションを結合（空の値はスキップ）
    if (styleParts.length > 0) {
      prompt += styleParts.join(",");
    }

    // 髪色が選択されている場合は追加
    if (selectedColorCode) {
      prompt += ` with hair color ${selectedColorCode}`;
    }

    // ユーザーが入力したスタイルの説明を追加
    if (promptText.trim()) {
      prompt += `. Additional style description: ${promptText.trim()}`;
    }

    return prompt;
  };

  // GPT Image 1で画像編集
  const editWithGPTImage1 = async (prompt: string, imageFile: File) => {
    const openai = getOpenAIClient();

    const editParams: GPTImageEditParams = {
      model: "gpt-image-1",
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: imageSize as
        | "1024x1024"
        | "auto"
        | "256x256"
        | "512x512"
        | "1536x1024"
        | "1024x1536",
      quality: imageQuality as "high" | "auto" | "standard" | "low" | "medium",
    };

    if (backgroundTransparent) {
      editParams.background = "transparent";
    }

    const response = await openai.images.edit(editParams);

    // Base64データをデータ URLに変換
    return (response.data || [])
      .filter((item) => item.b64_json || item.url)
      .map((item) => {
        if (item.b64_json) {
          return `data:image/png;base64,${item.b64_json}`;
        } else if (item.url) {
          return item.url;
        }
        return null;
      })
      .filter((url) => url !== null) as string[];
  };

  // DALL-E 3でフォールバック生成
  const generateWithDALLE3 = async (prompt: string) => {
    const openai = getOpenAIClient();
    const imagePromises = Array(1)
      .fill(null)
      .map(() =>
        openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        })
      );

    const responses = await Promise.all(imagePromises);
    return responses
      .map((response) => response.data?.[0]?.url)
      .filter((url): url is string => url !== null && url !== undefined);
  };

  const simulateProgress = (duration: number) => {
    const steps = [
      { progress: 10, message: "プロンプトを解析中..." },
      { progress: 30, message: "AIモデルを準備中..." },
      { progress: 50, message: "画像生成を開始中..." },
      { progress: 70, message: "スタイル調整中..." },
      { progress: 85, message: "最終処理中..." },
      { progress: 95, message: "画像を保存中..." }
    ];
    
    let currentStep = 0;
    const stepDuration = duration / steps.length;
    
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingProgress(steps[currentStep].progress);
        setLoadingStep(steps[currentStep].message);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, stepDuration);
    
    return interval;
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStep("準備中...");
    setResultImages([]);

    // プログレスバーのシミュレーション開始（30秒想定）
    const progressInterval = simulateProgress(30000);

    try {
      const prompt = generatePrompt();
      console.log("Generated prompt:", prompt);

      let imageUrls: string[] = [];

      // アップロード画像がある場合は編集APIを使用
      if (selectedImageFile) {
        console.log("アップロード画像あり - GPT Image 1 Edit APIを使用");
        setLoadingStep("アップロード画像を解析中...");

        try {
          imageUrls = await editWithGPTImage1(prompt, selectedImageFile);
          console.log("GPT Image 1 Edit で成功しました");
        } catch (editError) {
          console.warn(
            "GPT Image 1 Editでエラー、DALL-E 3にフォールバック:",
            editError
          );
          alert("画像の生成に失敗しました。");
          throw new Error("GPT Image 1 Editでエラー、DALL-E 3にフォールバック");
          // imageUrls = await generateWithDALLE3(prompt);
          // console.log("DALL-E 3 でフォールバック成功しました");
        }
      } else {
        // アップロード画像がない場合は通常の生成
        console.log("アップロード画像なし - GPT Image 1 Generate APIを使用");
        setLoadingStep("新しい画像を生成中...");

        try {
          const openai = getOpenAIClient();

          const imageParams: GPTImageGenerateParams = {
            model: "gpt-image-1",
            prompt: prompt,
            n: 4,
            size: imageSize as
              | "1024x1024"
              | "auto"
              | "256x256"
              | "512x512"
              | "1536x1024"
              | "1024x1536"
              | "1792x1024"
              | "1024x1792",
            quality: imageQuality as
              | "high"
              | "auto"
              | "standard"
              | "low"
              | "medium"
              | "hd",
          };

          if (backgroundTransparent) {
            imageParams.background = "transparent";
          }

          const response = await openai.images.generate(imageParams);

          // Base64データをデータ URLに変換
          imageUrls = (response.data || [])
            .filter((item) => item.b64_json || item.url)
            .map((item) => {
              if (item.b64_json) {
                return `data:image/png;base64,${item.b64_json}`;
              } else if (item.url) {
                return item.url;
              }
              return null;
            })
            .filter((url) => url !== null) as string[];

          console.log("GPT Image 1 Generate で成功しました");
        } catch (generateError) {
          console.warn(
            "GPT Image 1 Generateでエラー、DALL-E 3にフォールバック:",
            generateError
          );
          imageUrls = await generateWithDALLE3(prompt);
          console.log("DALL-E 3 でフォールバック成功しました");
        }
      }

      // プログレス完了
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingStep("完了！");
      
      // 少し待ってから結果を表示
      setTimeout(() => {
        setResultImages(imageUrls);
      }, 500);
    } catch (error) {
      console.error("Image generation failed:", error);

      let errorMessage = "画像の生成に失敗しました。";

      if (error instanceof Error) {
        if (error.message.includes("APIキー")) {
          errorMessage +=
            "\n\nAPIキーが設定されていません。.envファイルを確認してください。";
        } else if (error.message.includes("401")) {
          errorMessage +=
            "\n\nAPIキーが無効です。OpenAIのダッシュボードで確認してください。";
        } else if (error.message.includes("429")) {
          errorMessage +=
            "\n\nAPIリクエストの制限に達しました。少し待ってから再度お試しください。";
        } else if (error.message.includes("insufficient_quota")) {
          errorMessage += "\n\nOpenAIアカウントのクレジットが不足しています。";
        } else if (error.message.includes("gpt-image-1")) {
          errorMessage +=
            "\n\nGPT Image 1モデルが利用できません。DALL-E 3にフォールバックします。";
        } else if (error.message.includes("Unknown parameter")) {
          errorMessage +=
            "\n\nパラメーターエラー: " +
            error.message +
            "\n\nDALL-E 3にフォールバックします。";
        } else {
          errorMessage += "\n\nエラー詳細: " + error.message;
        }
      }

      alert(errorMessage);
      clearInterval(progressInterval);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStep("");
    }
  };

  const handleColorSelect = (level: number, code: string) => {
    const colors = isBlackBase ? blackHairBaseColors : bleachBaseColors;
    const colorData = colors[level]?.[code];
    if (colorData) {
      setSelectedColorCode(colorData.color); // 実際のhexカラーを保存
    }
  };

  const renderColorChart = () => {
    const colors = isBlackBase ? blackHairBaseColors : bleachBaseColors;
    const levels = Object.keys(colors).sort(
      (a, b) => parseInt(b) - parseInt(a)
    );

    const colorCodes = [
      "CB",
      "B",
      "WB",
      "PBe",
      "OBe",
      "Be",
      "Abe",
      "Pe",
      "Gr",
      "Ma",
      "Mt",
      "R",
      "K",
      "O",
      "G",
      "M",
      "L",
      "A",
      "CA",
      "V",
      "P",
    ];
    const colorLabels: { [key: string]: string } = {
      CB: "Cool Brown",
      B: "Brown",
      WB: "Warm Brown",
      PBe: "Pink Beige",
      OBe: "Orange Beige",
      Be: "Beige",
      Abe: "Ash Beige",
      Pe: "Perl",
      Gr: "Grege",
      Ma: "mauve",
      Mt: "Metallic",
      R: "Red",
      K: "Cooper",
      O: "Orange",
      G: "Gold",
      M: "Matt",
      L: "Lime",
      A: "Ash",
      CA: "Cobalt Ash",
      V: "Violet",
      P: "Pink",
    };

    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm min-w-[1000px]">
        {/* ヘッダー行 */}
        <div className="flex bg-gray-100 border-b-2 border-gray-300">
          <div className="w-6 p-2 text-center text-xs font-bold text-gray-700 border-r border-gray-300 flex items-center justify-center">
            Lv
          </div>
          {colorCodes.map((code) => (
            <div
              key={code}
              className="flex-1 p-1 text-center border-r border-gray-300 last:border-r-0 min-w-0"
            >
              <div className="text-xs font-bold text-gray-700 mb-1 truncate">
                {code}
              </div>
              <div className="text-xs text-gray-600 leading-tight truncate">
                {colorLabels[code]}
              </div>
            </div>
          ))}
        </div>

        {/* カラーレベル行 */}
        {levels.map((level) => (
          <div
            key={level}
            className="flex border-b border-gray-200 last:border-b-0"
          >
            <div className="w-6 p-1 text-center text-sm font-bold text-gray-700 bg-gray-50 border-r border-gray-300 flex items-center justify-center">
              {level}
            </div>
            {colorCodes.map((code) => {
              const colorData = colors[parseInt(level)]?.[code];
              const isSelected = selectedColorCode === colorData?.color;

              return (
                <div
                  key={code}
                  className={`flex-1 border-r border-gray-300 last:border-r-0 h-8 flex items-center justify-center min-w-0 ${
                    colorData
                      ? "cursor-pointer hover:ring-2 hover:ring-pink-300 transition-all"
                      : "bg-gray-100"
                  } ${isSelected ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() =>
                    colorData && handleColorSelect(parseInt(level), code)
                  }
                  title={
                    colorData
                      ? `${colorData.name} ${level}レベル (${colorData.color})`
                      : "利用不可"
                  }
                >
                  {colorData ? (
                    <div
                      className="w-full h-full flex items-center justify-center relative"
                      style={{ backgroundColor: colorData.color }}
                    >
                      {isSelected && (
                        <div className="w-3 h-3 bg-white rounded-full border-2 border-gray-600 shadow-sm"></div>
                      )}
                      {/* レベル/コードの小さなテキスト */}
                      <div className="absolute bottom-0 right-0 text-xs text-white bg-black bg-opacity-50 px-1 rounded-tl">
                        {code}/{level}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* ヘッダー */}
      {/* <header className="bg-white shadow-sm border-b border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Scissors className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-800">
              ヘアスタイルカタログ
            </h1>
          </div>
        </div>
      </header> */}

      {/* カテゴリーナビゲーション */}
      <div className="bg-gray-50 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          {/* <div className="flex space-x-4">
            {hairCategories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div> */}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-10xl mx-auto py-8 px-2">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 左側 - プロンプト入力エリア */}
          <div className="w-full md:w-2/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3">
                ヘアスタイルをカスタマイズ
              </h2>

              {/* 髪色選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  髪色
                </label>

                {/* ベースカラートグル */}
                <div className="mb-4">
                  <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg">
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isBlackBase
                          ? "bg-pink-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setIsBlackBase(true);
                        setSelectedColorCode("");
                      }}
                    >
                      黒髪ベース
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !isBlackBase
                          ? "bg-pink-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setIsBlackBase(false);
                        setSelectedColorCode("");
                      }}
                    >
                      ブリーチベース
                    </button>
                  </div>
                </div>

                {/* 選択されたカラー情報 */}
                {selectedColorCode && (
                  <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-medium text-gray-700">
                        選択中:{" "}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: selectedColorCode }}
                        ></div>
                        <span className="text-pink-700">
                          {selectedColorCode}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* カラーチャート */}
                <div className="overflow-x-auto">{renderColorChart()}</div>
              </div>

              {/* 髪の長さ選択 */}
              <BadgeSelection
                label="髪の長さ"
                options={hairLengthOptions}
                selectedValue={hairLength}
                onSelect={setHairLength}
              />

              {/* シルエット選択 */}
              <BadgeSelection
                label="シルエット"
                options={silhouetteOptions}
                selectedValue={silhouette}
                onSelect={setSilhouette}
              />

              {/* パーマ選択 */}
              <BadgeSelection
                label="パーマ"
                options={permOptions}
                selectedValue={perm}
                onSelect={setPerm}
              />

              {/* 髪の動き選択 */}
              <BadgeSelection
                label="髪の動き"
                options={hairMovementOptions}
                selectedValue={hairMovement}
                onSelect={setHairMovement}
              />

              {/* 質感選択 */}
              <BadgeSelection
                label="質感"
                options={textureOptions}
                selectedValue={texture}
                onSelect={setTexture}
              />

              {/* 髪質選択 */}
              <BadgeSelection
                label="髪質"
                options={hairQualityOptions}
                selectedValue={hairQuality}
                onSelect={setHairQuality}
              />

              {/* レイヤーの構成選択 */}
              <BadgeSelection
                label="レイヤーの構成"
                options={layerOptions}
                selectedValue={layers}
                onSelect={setLayers}
              />

              {/* 光の選択 */}
              <BadgeSelection
                label="光"
                options={lightingOptions}
                selectedValue={lighting}
                onSelect={setLighting}
              />

              {/* 画像アップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  元の画像
                </label>
                <div
                  className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="Original"
                        className="h-32 mx-auto rounded-lg object-cover"
                      />
                      <button
                        className="absolute top-1 right-1 bg-white bg-opacity-90 rounded-full p-1 hover:bg-red-500 hover:text-white shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
                          setSelectedImageFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-gray-500 text-sm">
                        クリックして画像をアップロード
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* GPT Image 1 設定 */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-gray-800">
                    画像生成設定 (GPT Image 1)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 画像品質 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      品質
                    </label>
                    <select
                      className="w-full rounded-lg bg-gray-50 border border-gray-200 text-gray-700 shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      value={imageQuality}
                      onChange={(e) => setImageQuality(e.target.value)}
                    >
                      <option value="low">低品質</option>
                      <option value="medium">中品質</option>
                      <option value="high">高品質</option>
                    </select>
                  </div>

                  {/* 画像サイズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サイズ
                    </label>
                    <select
                      className="w-full rounded-lg bg-gray-50 border border-gray-200 text-gray-700 shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                    >
                      <option value="1024x1024">正方形</option>
                      <option value="1024x1536">縦長</option>
                      <option value="1536x1024">横長</option>
                    </select>
                  </div>
                </div>

                {/* 背景透過 */}
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      checked={backgroundTransparent}
                      onChange={(e) =>
                        setBackgroundTransparent(e.target.checked)
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      背景を透明にする (PNG形式)
                    </span>
                  </label>
                </div>
              </div>

              {/* プロンプトテキストエリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  スタイルの説明
                </label>
                <textarea
                  className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 resize-none focus:ring-pink-500 focus:border-pink-500"
                  placeholder="ヘアスタイルの説明を入力してください..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>

              {/* メインボタン */}
              <button
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                  isLoading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                }`}
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>処理中...</span>
                  </>
                ) : (
                  <span>ヘアスタイルを生成</span>
                )}
              </button>
            </div>
          </div>

          {/* 右側 - 生成結果表示エリア */}
          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-7">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-6">
                生成されたヘアスタイル
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center w-full max-w-md mx-auto">
                    <RefreshCw className="w-10 h-10 mx-auto animate-spin text-pink-500 mb-4" />
                    
                    {/* プログレスバー */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-700 font-medium text-sm">{loadingStep}</p>
                        <span className="text-sm text-gray-500">{loadingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm">
                      高品質な画像を生成しています...
                      <br />
                      しばらくお待ちください
                    </p>
                  </div>
                </div>
              ) : resultImages.length > 0 ? (
                <div className="space-y-6">
                  {resultImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img
                        src={image}
                        alt={`Generated result ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-800">
                            スタイル #{index + 1}
                          </p>
                          <button
                            className="text-pink-500 hover:text-pink-600 flex items-center text-sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = image;
                              link.download = `hairstyle-${index + 1}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            保存
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-center p-6">
                    <Scissors className="w-6 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">ヘアスタイル未作成</p>
                    <p className="text-gray-400 text-sm">
                      フォームを入力して「ヘアスタイルを生成」ボタンをクリックしてください
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-gray-50 py-6 border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">
              © 2023 ヘアスタイルカタログ - すべての権利を保有
            </p>
            <p>
              免責事項:
              ヘアスタイルシミュレーターが生成したコンテンツが不適切または不正確な場合もあるため、コンテンツを再確認するようにしてください
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

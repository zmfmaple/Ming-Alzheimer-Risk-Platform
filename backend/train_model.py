"""
Alzheimer's Risk Prediction Model Training Script
"""

import pandas as pd
import numpy as np
import pickle
import shap
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, recall_score, classification_report
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# ============== 1. 数据加载与清洗 ==============
print("=" * 60)
print("1. 数据加载与清洗")
print("=" * 60)

DATA_PATH = "archive (1)/data/alzheimers_disease_data.csv"
df = pd.read_csv(DATA_PATH)
print(f"原始数据形状: {df.shape}")

# 剔除无关列
drop_cols = ['PatientID', 'DoctorInCharge']
df = df.drop(columns=drop_cols)
print(f"剔除无关列后: {df.shape}")

# 分离特征和目标
X = df.drop(columns=['Diagnosis'])
y = df['Diagnosis']

print(f"特征数量: {X.shape[1]}")
print(f"目标变量分布: 0(无AD)={sum(y==0)}, 1(有AD)={sum(y==1)}")

# ============== 2. 特征预处理 ==============
print("\n" + "=" * 60)
print("2. 特征预处理")
print("=" * 60)

# 识别分类变量和数值变量
categorical_cols = ['Gender', 'Ethnicity', 'EducationLevel', 'Smoking',
                    'FamilyHistoryAlzheimers', 'CardiovascularDisease',
                    'Diabetes', 'Depression', 'HeadInjury', 'Hypertension',
                    'MemoryComplaints', 'BehavioralProblems',
                    'Confusion', 'Disorientation', 'PersonalityChanges',
                    'DifficultyCompletingTasks', 'Forgetfulness']

numerical_cols = ['Age', 'BMI', 'AlcoholConsumption', 'PhysicalActivity',
                  'DietQuality', 'SleepQuality', 'SystolicBP', 'DiastolicBP',
                  'CholesterolTotal', 'CholesterolLDL', 'CholesterolHDL',
                  'CholesterolTriglycerides', 'MMSE', 'FunctionalAssessment', 'ADL']

# Label Encoding for categorical variables
label_encoders = {}
for col in categorical_cols:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le

print(f"分类变量编码完成: {len(label_encoders)} 个")

# 数值特征标准化
scaler = StandardScaler()
X[numerical_cols] = scaler.fit_transform(X[numerical_cols])
print(f"数值特征标准化完成: {len(numerical_cols)} 个")

# 保存scaler
with open('models/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("Scaler 已保存到 models/scaler.pkl")

feature_names = X.columns.tolist()

# ============== 3. 模型训练与对比 ==============
print("\n" + "=" * 60)
print("3. 模型训练与对比")
print("=" * 60)

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"训练集: {X_train.shape[0]}, 测试集: {X_test.shape[0]}")

# 定义模型
models = {
    'RandomForest': RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    ),
    'XGBoost': XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss',
        n_jobs=-1
    )
}

results = {}

for name, model in models.items():
    print(f"\n训练 {name}...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)

    results[name] = {
        'model': model,
        'accuracy': acc,
        'f1': f1,
        'recall': recall
    }

    print(f"{name} - Accuracy: {acc:.4f}, F1: {f1:.4f}, Recall: {recall:.4f}")

# ============== 4. 选择最佳模型 ==============
print("\n" + "=" * 60)
print("4. 模型选择")
print("=" * 60)

# 选择F1最高的模型
best_model_name = max(results, key=lambda x: results[x]['f1'])
best_model = results[best_model_name]['model']
best_f1 = results[best_model_name]['f1']

print(f"最佳模型: {best_model_name}")
print(f"F1-Score: {best_f1:.4f}")

# 保存最佳模型
with open('models/alzheimers_model.pkl', 'wb') as f:
    pickle.dump(best_model, f)
print("模型已保存到 models/alzheimers_model.pkl")

# 保存特征名称
with open('models/feature_names.pkl', 'wb') as f:
    pickle.dump(feature_names, f)

# ============== 5. SHAP 解释器集成 ==============
print("\n" + "=" * 60)
print("5. SHAP 解释器集成")
print("=" * 60)

# 初始化 TreeExplainer
explainer = shap.TreeExplainer(best_model)

# 保存 explainer
with open('models/shap_explainer.pkl', 'wb') as f:
    pickle.dump(explainer, f)
print("SHAP explainer 已保存到 models/shap_explainer.pkl")


def get_explanation(feature_dict):
    """
    接收单行特征数据，计算SHAP值，返回贡献度最高的前3个特征

    Args:
        feature_dict: 字典，键为特征名，值为特征值

    Returns:
        list: [{'feature': 特征名, 'value': 原始值, 'impact': 'positive/negative', 'shap_value': SHAP值}, ...]
    """
    # 转换为DataFrame
    df_input = pd.DataFrame([feature_dict])

    # 确保特征顺序一致
    df_input = df_input[feature_names]

    # 计算SHAP值
    shap_values = explainer.shap_values(df_input)

    # 对于二分类，取正类的SHAP值
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]  # 正类概率的SHAP值
    else:
        shap_vals = shap_values[0]

    # 确保shap_vals是一维数组
    shap_vals = np.array(shap_vals).flatten()

    # 创建特征贡献排序
    feature_importance = []
    for i, fname in enumerate(feature_names):
        sv = float(shap_vals[i])  # 转为Python float
        feature_importance.append({
            'feature': fname,
            'value': feature_dict.get(fname, None),
            'shap_value': sv,
            'impact': 'positive' if sv > 0 else 'negative'
        })

    # 按SHAP值绝对值排序，取前3
    feature_importance.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    top_3 = feature_importance[:3]

    return top_3


# ============== 6. 运行报告 ==============
print("\n" + "=" * 60)
print("6. 最终模型性能报告")
print("=" * 60)

y_pred_final = best_model.predict(X_test)
final_acc = accuracy_score(y_test, y_pred_final)
final_f1 = f1_score(y_test, y_pred_final)
final_recall = recall_score(y_test, y_pred_final)

print(f"模型: {best_model_name}")
print(f"Accuracy:  {final_acc:.4f}")
print(f"F1-Score:  {final_f1:.4f}")
print(f"Recall:    {final_recall:.4f}")

print("\n分类报告:")
print(classification_report(y_test, y_pred_final, target_names=['无AD', '有AD']))

# Top 5 核心风险特征
print("\n" + "=" * 60)
print("Top 5 核心风险特征")
print("=" * 60)

if hasattr(best_model, 'feature_importances_'):
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)

    for i, row in importance_df.head(5).iterrows():
        print(f"  {importance_df.head(5).index.get_loc(i)+1}. {row['feature']}: {row['importance']:.4f}")

# 演示 SHAP 解释
print("\n" + "=" * 60)
print("SHAP 解释演示")
print("=" * 60)

# 取测试集第一条数据演示
sample_data = X_test.iloc[0].to_dict()
sample_prediction = best_model.predict(X_test.iloc[[0]])[0]
sample_proba = best_model.predict_proba(X_test.iloc[[0]])[0]

print(f"样本预测: {'有AD风险' if sample_prediction == 1 else '无AD风险'}")
print(f"预测概率: 有AD={sample_proba[1]:.4f}, 无AD={sample_proba[0]:.4f}")

explanation = get_explanation(sample_data)
print("\nTop 3 影响因素:")
for exp in explanation:
    direction = "↑ 增加风险" if exp['impact'] == 'positive' else "↓ 降低风险"
    print(f"  - {exp['feature']}: {exp['shap_value']:.4f} {direction}")

print("\n" + "=" * 60)
print("训练完成！")
print("=" * 60)

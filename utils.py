def fix_id(doc):
    if not doc:
        return None
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def fix_ids(docs):
    return [fix_id(d) for d in docs]
